from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.usability import Feedback, UsabilityEvent
from app.models.user import User
from app.schemas.usability import EventIn, EventOut, FeedbackIn, FeedbackOut
from app.security import get_current_user

router = APIRouter(tags=["usability"])


@router.post("/usability/events", response_model=EventOut)
def log_event(
    body: EventIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EventOut:
    event = UsabilityEvent(user_id=user.id, event_type=body.event_type, task=body.task, screen=body.screen)
    db.add(event)
    db.commit()
    db.refresh(event)
    return EventOut(
        id=event.id,
        event_type=event.event_type,
        task=event.task,
        screen=event.screen,
        created_at=event.created_at,
    )


@router.post("/feedback", response_model=FeedbackOut)
def submit_feedback(
    body: FeedbackIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FeedbackOut:
    feedback = Feedback(user_id=user.id, rating=body.rating, comment=body.comment, screen=body.screen)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return FeedbackOut(
        id=feedback.id,
        rating=feedback.rating,
        comment=feedback.comment,
        screen=feedback.screen,
        created_at=feedback.created_at,
    )
