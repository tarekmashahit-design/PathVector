from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import User
from services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyRequest(BaseModel):
    email: EmailStr
    code: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    is_verified: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing is not None:
        if existing.is_verified:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        # Unverified account retrying registration — reissue a fresh code rather than blocking.
        existing.password_hash = auth_service.hash_password(body.password)
        code = auth_service.generate_verification_code()
        existing.verification_code = code
        existing.verification_expires_at = auth_service.verification_expiry()
        await db.commit()
    else:
        code = auth_service.generate_verification_code()
        user = User(
            email=body.email,
            password_hash=auth_service.hash_password(body.password),
            is_verified=False,
            verification_code=code,
            verification_expires_at=auth_service.verification_expiry(),
        )
        db.add(user)
        await db.commit()

    try:
        auth_service.send_verification_email(body.email, code)
    except Exception as exc:  # noqa: BLE001 — account exists either way; surface the mail failure distinctly
        raise HTTPException(status_code=502, detail=f"Account created but the verification email failed to send: {exc}") from exc

    return {"message": "Verification code sent."}


@router.post("/verify", response_model=TokenResponse)
async def verify(body: VerifyRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email))
    if user is None:
        raise HTTPException(status_code=404, detail="No pending registration for this email.")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="This account is already verified.")
    if not user.verification_code or user.verification_code != body.code:
        raise HTTPException(status_code=400, detail="Incorrect verification code.")
    expires_at = user.verification_expires_at
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at is not None and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This code has expired. Register again to get a new one.")

    user.is_verified = True
    user.verification_code = None
    user.verification_expires_at = None
    await db.commit()

    token = auth_service.create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email))
    if user is None or not auth_service.verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before signing in.")

    token = auth_service.create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing Authorization header.")
    try:
        payload = auth_service.decode_access_token(credentials.credentials)
    except auth_service.JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from exc

    user = await db.get(User, payload.get("sub"))
    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists.")
    return user


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user, from_attributes=True)
