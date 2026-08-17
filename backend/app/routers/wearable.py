from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.enums import WearableSource
from app.models.progress import WearableData
from app.models.user import User
from app.schemas.wearable import (
    WearableReadingOut,
    WearableRecentResponse,
    WearableSyncRequest,
    WearableSyncResponse,
)
from app.security import get_current_user

router = APIRouter(prefix="/wearable", tags=["wearable"])

SOURCE = WearableSource.health_connect


def _normalize_recorded_at(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _out(row: WearableData) -> WearableReadingOut:
    return WearableReadingOut(
        id=row.id,
        source=row.source,
        metric_type=row.metric_type,
        value=row.value,
        recorded_at=row.recorded_at,
    )


@router.post("/sync", response_model=WearableSyncResponse)
def sync_wearable(
    body: WearableSyncRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WearableSyncResponse:
    """Upsert Health Connect readings. Dedupe on (user_id, metric_type, recorded_at)."""
    inserted = 0
    updated = 0
    results: list[WearableData] = []

    for reading in body.readings:
        recorded_at = _normalize_recorded_at(reading.recorded_at)
        existing = db.scalars(
            select(WearableData).where(
                WearableData.user_id == user.id,
                WearableData.metric_type == reading.metric_type,
                WearableData.recorded_at == recorded_at,
            )
        ).first()
        if existing:
            existing.value = reading.value
            existing.source = SOURCE
            results.append(existing)
            updated += 1
        else:
            row = WearableData(
                user_id=user.id,
                source=SOURCE,
                metric_type=reading.metric_type,
                value=reading.value,
                recorded_at=recorded_at,
            )
            db.add(row)
            results.append(row)
            inserted += 1

    db.commit()
    for row in results:
        db.refresh(row)

    return WearableSyncResponse(
        inserted=inserted,
        updated=updated,
        total=len(results),
        readings=[_out(row) for row in results],
    )


@router.get("/recent", response_model=WearableRecentResponse)
def recent_wearable(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WearableRecentResponse:
    """Latest reading per metric type for dashboard display."""
    rows = db.scalars(
        select(WearableData)
        .where(WearableData.user_id == user.id)
        .order_by(WearableData.recorded_at.desc())
    ).all()

    latest: dict[str, WearableData] = {}
    for row in rows:
        key = row.metric_type.value
        if key not in latest:
            latest[key] = row

    readings = [_out(row) for row in latest.values()]
    synced_at = max((r.recorded_at for r in readings), default=None)
    return WearableRecentResponse(readings=readings, synced_at=synced_at)
