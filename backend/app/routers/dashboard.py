from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models.food import CalorieTarget, FoodLog
from app.models.user import User
from app.security import get_current_user
from app.services.calorie import calculate_targets

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _macros_for_log(log: FoodLog) -> dict[str, float]:
    per_100 = log.dish.nutrition_per_100g
    scale = log.serving_size_g / 100.0
    return {
        "calories": float(per_100.get("calories", 0)) * scale,
        "protein": float(per_100.get("protein", 0)) * scale,
        "carbs": float(per_100.get("carbs", 0)) * scale,
        "fat": float(per_100.get("fat", 0)) * scale,
    }


@router.get("/today")
def dashboard_today(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if user.profile is None:
        raise HTTPException(status_code=400, detail="Complete onboarding profile first")
    today = date.today()
    target = db.scalar(
        select(CalorieTarget).where(
            CalorieTarget.user_id == user.id, CalorieTarget.date == today
        )
    )
    if target is None:
        values = calculate_targets(user.profile)
        target = CalorieTarget(
            user_id=user.id, date=today, source="calculated", **values
        )
        db.add(target)
        db.commit()
        db.refresh(target)

    start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    logs = db.scalars(
        select(FoodLog)
        .options(selectinload(FoodLog.dish))
        .where(FoodLog.user_id == user.id, FoodLog.logged_at >= start)
        .order_by(FoodLog.logged_at)
    ).all()
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    entries = []
    for log in logs:
        macros = _macros_for_log(log)
        for key, value in macros.items():
            totals[key] += value
        entries.append(
            {
                "id": str(log.id),
                "dish_name": log.dish.name,
                "nutrition_source": log.dish.nutrition_source,
                "serving_size_g": log.serving_size_g,
                "confidence_score": log.confidence_score,
                **macros,
            }
        )
    return {
        "date": today.isoformat(),
        "target": {
            "calories": target.target_calories,
            "protein_g": target.target_protein_g,
            "carbs_g": target.target_carbs_g,
            "fat_g": target.target_fat_g,
            "source": target.source,
        },
        "logged": {
            "calories": round(totals["calories"], 1),
            "protein_g": round(totals["protein"], 1),
            "carbs_g": round(totals["carbs"], 1),
            "fat_g": round(totals["fat"], 1),
        },
        "remaining": {
            "calories": round(target.target_calories - totals["calories"], 1),
            "protein_g": round(target.target_protein_g - totals["protein"], 1),
            "carbs_g": round(target.target_carbs_g - totals["carbs"], 1),
            "fat_g": round(target.target_fat_g - totals["fat"], 1),
        },
        "entries": entries,
    }
