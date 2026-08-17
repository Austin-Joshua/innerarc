from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.db import engine
from app.models import *  # noqa: F403 — register metadata for Alembic and runtime
from app.routers.auth import router as auth_router
from app.routers.coach import router as coach_router
from app.routers.dashboard import router as dashboard_router
from app.routers.food import dishes_router, router as food_router
from app.routers.gamification import router as gamification_router
from app.routers.progress import router as progress_router
from app.routers.usability import router as usability_router
from app.routers.wearable import router as wearable_router
from app.routers.workouts import router as workouts_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    photo_root = Path(settings.object_storage_path)
    photo_root.mkdir(parents=True, exist_ok=True)
    yield
    engine.dispose()


app = FastAPI(
    title="Innerarc",
    description="Closed-loop AI health companion API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(food_router)
app.include_router(dishes_router)
app.include_router(dashboard_router)
app.include_router(workouts_router)
app.include_router(progress_router)
app.include_router(coach_router)
app.include_router(gamification_router)
app.include_router(wearable_router)
app.include_router(usability_router)


@app.get("/health")
def health() -> dict[str, str]:
    db_status = "ok"
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        db_status = "unavailable"
    return {"status": "ok", "database": db_status}
