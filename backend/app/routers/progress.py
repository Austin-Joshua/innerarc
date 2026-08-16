from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models.food import FoodLog
from app.models.progress import ProgressPhoto
from app.models.user import User
from app.models.workout import WorkoutLog
from app.schemas.progress import (
    ConsistencyMetrics,
    ComputedRatios,
    MilestoneStub,
    ProgressPhotoOut,
    ProgressTimelineOut,
    ProgressUploadResponse,
)
from app.security import get_current_user
from app.services.gamification import apply_event, state_dict, status_for_user
from app.services.pose import PoseFailure, PoseSuccess, estimate_pose

router = APIRouter(prefix="/progress", tags=["progress"])


def _storage_root() -> Path:
    root = Path(settings.object_storage_path) / "progress"
    root.mkdir(parents=True, exist_ok=True)
    return root


def _resolve_storage_path(image_url: str) -> Path:
    """image_url in DB is an opaque relative key under object storage."""
    path = Path(image_url)
    if path.is_absolute():
        return path
    return Path(settings.object_storage_path) / path


def _public_image_url(photo_id: UUID) -> str:
    return f"/progress/photos/{photo_id}/image"


def _photo_out(photo: ProgressPhoto) -> ProgressPhotoOut:
    ratios = photo.computed_ratios_json or {}
    landmarks = photo.pose_landmarks_json or {}
    return ProgressPhotoOut(
        id=photo.id,
        image_url=_public_image_url(photo.id),
        taken_at=photo.taken_at,
        mean_visibility=landmarks.get("mean_visibility"),
        ratios=ComputedRatios(
            waist_to_hip=float(ratios["waist_to_hip"]),
            shoulder_to_waist=float(ratios["shoulder_to_waist"]),
            pixel_widths=dict(ratios.get("pixel_widths") or {}),
        ),
    )


def _consistency(db: Session, user_id: UUID, start: datetime, end: datetime) -> ConsistencyMetrics:
    workouts_logged = db.scalar(
        select(func.count())
        .select_from(WorkoutLog)
        .where(
            WorkoutLog.user_id == user_id,
            WorkoutLog.completed_at >= start,
            WorkoutLog.completed_at <= end,
        )
    ) or 0

    food_days = db.scalars(
        select(func.date(FoodLog.logged_at)).where(
            FoodLog.user_id == user_id,
            FoodLog.logged_at >= start,
            FoodLog.logged_at <= end,
        )
    ).all()
    workout_days = db.scalars(
        select(func.date(WorkoutLog.completed_at)).where(
            WorkoutLog.user_id == user_id,
            WorkoutLog.completed_at >= start,
            WorkoutLog.completed_at <= end,
        )
    ).all()
    days_active = len({*food_days, *workout_days})
    return ConsistencyMetrics(
        period_start=start,
        period_end=end,
        workouts_logged=int(workouts_logged),
        days_active=days_active,
    )


def _milestone(db: Session, user: User, photo_count: int, newly_earned: list[str] | None = None) -> MilestoneStub:
    # Real streak from gamification row (updated on this upload) — no "else 0" stub.
    state = status_for_user(db, user.id)
    streak = state.streak_count
    new = newly_earned or []
    if "first_progress_photo" in new or (photo_count == 1 and "first_progress_photo" in state.badges_earned):
        return MilestoneStub(
            code="first_progress_photo",
            message="Baseline saved. Consistency metrics will grow with meals and workouts.",
            streak_count=streak,
        )
    if photo_count == 2:
        return MilestoneStub(
            code="second_progress_photo",
            message="Second check-in unlocked side-by-side comparison.",
            streak_count=streak,
        )
    if new:
        return MilestoneStub(
            code=new[0],
            message=f"Badge earned: {new[0].replace('_', ' ')}.",
            streak_count=streak,
        )
    return MilestoneStub(code=None, message=None, streak_count=streak)


def _user_photos(db: Session, user_id: UUID) -> list[ProgressPhoto]:
    return list(
        db.scalars(
            select(ProgressPhoto)
            .where(ProgressPhoto.user_id == user_id)
            .order_by(ProgressPhoto.taken_at.asc())
        ).all()
    )


@router.post("/photos", response_model=ProgressUploadResponse)
def upload_progress_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProgressUploadResponse:
    suffix = Path(file.filename or "progress.jpg").suffix.lower() or ".jpg"
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        suffix = ".jpg"
    file_id = uuid4()
    relative_key = f"progress/{file_id}{suffix}"
    stored = _storage_root() / f"{file_id}{suffix}"
    stored.write_bytes(file.file.read())

    result = estimate_pose(stored)
    if isinstance(result, PoseFailure):
        stored.unlink(missing_ok=True)
        raise HTTPException(
            status_code=422,
            detail=result.message,
        )

    assert isinstance(result, PoseSuccess)
    existing = _user_photos(db, user.id)
    previous = existing[-1] if existing else None
    now = datetime.now(timezone.utc)
    photo = ProgressPhoto(
        id=file_id,
        user_id=user.id,
        image_url=relative_key,
        taken_at=now,
        pose_landmarks_json=result.pose_landmarks_json,
        computed_ratios_json=result.computed_ratios_json,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    gamification = apply_event(db, user.id, "progress_photo")
    db.commit()

    photos = existing + [photo]
    if previous is not None:
        period_start, period_end = previous.taken_at, photo.taken_at
    else:
        period_end = photo.taken_at
        period_start = period_end - timedelta(days=7)

    return ProgressUploadResponse(
        current=_photo_out(photo),
        previous=_photo_out(previous) if previous else None,
        consistency=_consistency(db, user.id, period_start, period_end),
        milestone=_milestone(db, user, len(photos), gamification.new_badges),
        trend=[_photo_out(p) for p in photos],
        gamification=state_dict(gamification),
    )


@router.get("/photos", response_model=list[ProgressPhotoOut])
def list_progress_photos(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProgressPhotoOut]:
    return [_photo_out(p) for p in _user_photos(db, user.id)]


@router.get("/photos/{photo_id}/image")
def get_progress_photo_image(
    photo_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    # Ownership check: unknown or other user's id → 404 (not 403) to avoid leaking existence.
    photo = db.scalar(
        select(ProgressPhoto).where(ProgressPhoto.id == photo_id, ProgressPhoto.user_id == user.id)
    )
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    path = _resolve_storage_path(photo.image_url)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Photo not found")
    media = "image/jpeg"
    if path.suffix.lower() == ".png":
        media = "image/png"
    elif path.suffix.lower() == ".webp":
        media = "image/webp"
    return FileResponse(path, media_type=media, filename=path.name)


@router.get("/timeline", response_model=ProgressTimelineOut)
def progress_timeline(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProgressTimelineOut:
    photos = _user_photos(db, user.id)
    now = datetime.now(timezone.utc)
    if len(photos) >= 2:
        period_start, period_end = photos[-2].taken_at, photos[-1].taken_at
    elif len(photos) == 1:
        period_end = photos[0].taken_at
        period_start = period_end - timedelta(days=7)
    else:
        period_end = now
        period_start = now - timedelta(days=7)
    return ProgressTimelineOut(
        photos=[_photo_out(p) for p in photos],
        consistency=_consistency(db, user.id, period_start, period_end),
        milestone=_milestone(db, user, len(photos)),
    )
