import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent / ".env")

from db.database import init_db  # noqa: E402
from db.seed import seed_admin_user  # noqa: E402
from routers import auth, demo, live  # noqa: E402 (must come after load_dotenv)

app = FastAPI(title="PathVector Demo API")


@app.on_event("startup")
async def _on_startup() -> None:
    await init_db()
    await seed_admin_user()

_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
_origins = [o.strip() for o in os.environ.get("CORS_ORIGIN", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(demo.router)
app.include_router(live.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
