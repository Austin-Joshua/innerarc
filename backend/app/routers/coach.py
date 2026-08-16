from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models.engagement import AIConversation
from app.models.user import User
from app.schemas.coach import CoachChatRequest, CoachChatResponse, CoachHistoryItem
from app.security import get_current_user
from app.services.coach import (
    build_user_snapshot,
    generate_coach_reply,
    safety_precheck,
    snapshot_summary,
)

router = APIRouter(prefix="/coach", tags=["coach"])


@router.post("/chat", response_model=CoachChatResponse)
def coach_chat(
    body: CoachChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CoachChatResponse:
    user = db.scalar(
        select(User).options(selectinload(User.profile)).where(User.id == user.id)
    )
    if user is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    snapshot = build_user_snapshot(db, user)
    blocked_text = safety_precheck(body.message)
    safety_precheck_blocked = blocked_text is not None
    snapshot = {
        **snapshot,
        "safety_precheck": "blocked" if safety_precheck_blocked else "passed",
    }

    if blocked_text is not None:
        reply = blocked_text
    else:
        try:
            reply = generate_coach_reply(body.message, snapshot)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001 — surface provider failures cleanly
            raise HTTPException(status_code=502, detail=f"Coach model error: {exc}") from exc

    row = AIConversation(
        user_id=user.id,
        message=body.message,
        response=reply,
        referenced_data_snapshot=snapshot,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return CoachChatResponse(
        id=row.id,
        message=body.message,
        response=reply,
        created_at=row.created_at,
        snapshot_summary=snapshot_summary(snapshot),
        safety_precheck_blocked=safety_precheck_blocked,
    )


@router.get("/history", response_model=list[CoachHistoryItem])
def coach_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CoachHistoryItem]:
    rows = db.scalars(
        select(AIConversation)
        .where(AIConversation.user_id == user.id)
        .order_by(AIConversation.created_at.desc())
        .limit(50)
    ).all()
    items: list[CoachHistoryItem] = []
    for row in rows:
        snap = row.referenced_data_snapshot or {}
        items.append(
            CoachHistoryItem(
                id=row.id,
                message=row.message,
                response=row.response,
                created_at=row.created_at,
                safety_precheck_blocked=snap.get("safety_precheck") == "blocked",
            )
        )
    return items
