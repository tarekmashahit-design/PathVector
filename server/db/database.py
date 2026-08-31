"""SQLite (via SQLAlchemy async + aiosqlite) — auth-only. Separate from
everything demo/live mode uses (those stay in-memory, unaffected)."""
from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DB_PATH = Path(__file__).resolve().parent.parent / "pathvector.db"
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH}")

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    from db import models  # noqa: F401 — ensures the model is registered on Base before create_all

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
