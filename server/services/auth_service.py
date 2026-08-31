"""Password hashing, verification codes, JWTs, and the Resend email send.
Isolated from demo/live services entirely — nothing here is imported by them."""
from __future__ import annotations

import os
import random
import string
from datetime import datetime, timedelta, timezone

import bcrypt
import resend
from jose import JWTError, jwt

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7
VERIFICATION_CODE_TTL_MINUTES = 15


def _jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is not set. Add it to server/.env.")
    return secret


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def generate_verification_code() -> str:
    return "".join(random.choices(string.digits, k=6))


def verification_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_CODE_TTL_MINUTES)


def create_access_token(user_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Raises JWTError (caught by the router as a 401) on any invalid/expired token."""
    return jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])


def send_verification_email(to_email: str, code: str) -> None:
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        raise RuntimeError("RESEND_API_KEY is not set. Add it to server/.env.")
    resend.api_key = api_key
    resend.Emails.send(
        {
            "from": "PathVector <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "Your PathVector verification code",
            "html": (
                f"<p>Your PathVector verification code is:</p>"
                f"<p style='font-size:28px;font-weight:700;letter-spacing:4px'>{code}</p>"
                f"<p>This code expires in {VERIFICATION_CODE_TTL_MINUTES} minutes.</p>"
            ),
        }
    )


__all__ = [
    "JWTError",
    "hash_password",
    "verify_password",
    "generate_verification_code",
    "verification_expiry",
    "create_access_token",
    "decode_access_token",
    "send_verification_email",
]
