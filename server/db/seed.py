"""Seeds the pre-existing admin/pathvector demo account as a real, verified
user on startup — replacing what used to be a hardcoded frontend check."""
from __future__ import annotations

import os

from sqlalchemy import select

from db.database import SessionLocal
from db.models import User
from services import auth_service

ADMIN_EMAIL = "admin@pathvector.io"


async def seed_admin_user() -> None:
    password = os.environ.get("ADMIN_PASSWORD")
    if not password:
        # Nothing to seed with — don't crash startup over a missing dev default.
        return

    async with SessionLocal() as session:
        existing = await session.scalar(select(User).where(User.email == ADMIN_EMAIL))
        if existing is not None:
            return
        admin = User(
            email=ADMIN_EMAIL,
            password_hash=auth_service.hash_password(password),
            is_verified=True,
            verification_code=None,
            verification_expires_at=None,
        )
        session.add(admin)
        await session.commit()
