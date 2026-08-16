from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.schemas.gamification import GamificationOut
from app.security import get_current_user
from app.services.gamification import state_dict, status_for_user

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/status", response_model=GamificationOut)
def gamification_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GamificationOut:
    state = status_for_user(db, user.id)
    return GamificationOut(**state_dict(state))
