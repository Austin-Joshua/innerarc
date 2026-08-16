from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models.enums import EquipmentAccess, WorkoutLevel, WorkoutModality
from app.models.user import User
from app.models.workout import Program, ProgramWorkout, Workout, WorkoutExercise, WorkoutLog
from app.schemas.workouts import (
    ProgramDetailOut,
    ProgramSlotOut,
    ProgramSummaryOut,
    WorkoutDetailOut,
    WorkoutExerciseOut,
    WorkoutLogCreate,
    WorkoutLogOut,
    WorkoutSummaryOut,
)
from app.security import get_current_user
from app.services.gamification import apply_event, state_dict

router = APIRouter(tags=["workouts"])

# Ordered equipment tiers: user access includes every workout whose required
# tier is at or below theirs (none < home_gym < full_gym).
EQUIPMENT_RANK = {
    EquipmentAccess.none.value: 0,
    EquipmentAccess.home_gym.value: 1,
    EquipmentAccess.full_gym.value: 2,
}

MET_BY_MODALITY = {
    WorkoutModality.bodyweight: 4.0,
    WorkoutModality.home_gym: 5.0,
    WorkoutModality.weighted: 6.0,
    WorkoutModality.yoga: 2.5,
    WorkoutModality.aerobics: 6.5,
}


def _required_equipment_rank(equipment_needed: list[str]) -> int:
    ranks = [EQUIPMENT_RANK[item] for item in equipment_needed if item in EQUIPMENT_RANK]
    return max(ranks) if ranks else 0


def _accessible_under(access: EquipmentAccess, equipment_needed: list[str]) -> bool:
    return _required_equipment_rank(equipment_needed) <= EQUIPMENT_RANK[access.value]


def _summary(workout: Workout) -> WorkoutSummaryOut:
    return WorkoutSummaryOut(
        id=workout.id,
        name=workout.name,
        modality=workout.modality.value,
        level=workout.level.value,
        goal_tags=list(workout.goal_tags or []),
        equipment_needed=list(workout.equipment_needed or []),
        media_url=workout.media_url,
        exercise_count=len(workout.workout_exercises or []),
    )


def _detail(workout: Workout) -> WorkoutDetailOut:
    ordered = sorted(workout.workout_exercises, key=lambda row: row.order_index)
    exercises = [
        WorkoutExerciseOut(
            exercise_id=link.exercise_id,
            name=link.exercise.name,
            description=link.exercise.description,
            media_url=link.exercise.media_url,
            order_index=link.order_index,
            sets=link.sets,
            reps=link.reps,
            duration_seconds=link.duration_seconds,
            rest_seconds=link.rest_seconds,
        )
        for link in ordered
    ]
    base = _summary(workout)
    return WorkoutDetailOut(**base.model_dump(), exercises=exercises)


def _load_workouts(db: Session) -> list[Workout]:
    return list(
        db.scalars(
            select(Workout)
            .options(selectinload(Workout.workout_exercises).selectinload(WorkoutExercise.exercise))
            .order_by(Workout.name)
        ).all()
    )


def _filter_workouts(
    workouts: list[Workout],
    *,
    modality: str | None,
    level: str | None,
    goal: str | None,
    equipment_access: EquipmentAccess | None,
) -> list[Workout]:
    results = workouts
    if modality:
        results = [w for w in results if w.modality.value == modality]
    if level:
        results = [w for w in results if w.level.value == level]
    if goal:
        results = [w for w in results if goal in (w.goal_tags or [])]
    if equipment_access is not None:
        results = [w for w in results if _accessible_under(equipment_access, w.equipment_needed or [])]
    return results


@router.get("/workouts", response_model=list[WorkoutSummaryOut])
def list_workouts(
    modality: str | None = Query(default=None),
    level: str | None = Query(default=None),
    goal: str | None = Query(default=None),
    equipment_access: EquipmentAccess | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[WorkoutSummaryOut]:
    if modality and modality not in WorkoutModality._value2member_map_:
        raise HTTPException(status_code=400, detail="Invalid modality")
    if level and level not in WorkoutLevel._value2member_map_:
        raise HTTPException(status_code=400, detail="Invalid level")
    workouts = _filter_workouts(
        _load_workouts(db),
        modality=modality,
        level=level,
        goal=goal,
        equipment_access=equipment_access,
    )
    return [_summary(w) for w in workouts]


@router.get("/workouts/recommend", response_model=list[WorkoutSummaryOut])
def recommend_workouts(
    modality: str | None = Query(default=None),
    level: str | None = Query(default=None),
    goal: str | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[WorkoutSummaryOut]:
    """Recommend workouts using profile goal + equipment with optional overrides.

    Equipment matching is a supersets relationship, not exact match.
    Ordered tiers: none < home_gym < full_gym. The user's access includes
    every workout whose required equipment tier is at or below theirs
    (e.g. full_gym also sees none and home_gym workouts).
    """
    if user.profile is None:
        raise HTTPException(status_code=400, detail="Complete onboarding before recommendations")
    if modality and modality not in WorkoutModality._value2member_map_:
        raise HTTPException(status_code=400, detail="Invalid modality")
    if level and level not in WorkoutLevel._value2member_map_:
        raise HTTPException(status_code=400, detail="Invalid level")

    profile_goal = goal or user.profile.goal.value
    access = user.profile.equipment_access
    workouts = _filter_workouts(
        _load_workouts(db),
        modality=modality,
        level=level,
        goal=profile_goal,
        equipment_access=access,
    )
    # Prefer goal match; if empty, fall back to equipment-accessible library.
    if not workouts:
        workouts = _filter_workouts(
            _load_workouts(db),
            modality=modality,
            level=level,
            goal=None,
            equipment_access=access,
        )
    return [_summary(w) for w in workouts]


@router.get("/workouts/{workout_id}", response_model=WorkoutDetailOut)
def get_workout(workout_id: UUID, db: Session = Depends(get_db)) -> WorkoutDetailOut:
    workout = db.scalar(
        select(Workout)
        .where(Workout.id == workout_id)
        .options(selectinload(Workout.workout_exercises).selectinload(WorkoutExercise.exercise))
    )
    if workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    return _detail(workout)


@router.get("/programs", response_model=list[ProgramSummaryOut])
def list_programs(db: Session = Depends(get_db)) -> list[ProgramSummaryOut]:
    programs = db.scalars(
        select(Program).options(selectinload(Program.program_workouts)).order_by(Program.name)
    ).all()
    return [
        ProgramSummaryOut(
            id=program.id,
            name=program.name,
            duration_weeks=program.duration_weeks,
            workout_count=len(program.program_workouts),
        )
        for program in programs
    ]


@router.get("/programs/{program_id}", response_model=ProgramDetailOut)
def get_program(program_id: UUID, db: Session = Depends(get_db)) -> ProgramDetailOut:
    program = db.scalar(
        select(Program)
        .where(Program.id == program_id)
        .options(
            selectinload(Program.program_workouts)
            .selectinload(ProgramWorkout.workout)
            .selectinload(Workout.workout_exercises)
            .selectinload(WorkoutExercise.exercise)
        )
    )
    if program is None:
        raise HTTPException(status_code=404, detail="Program not found")
    schedule = sorted(
        program.program_workouts,
        key=lambda slot: (slot.week_number, slot.day_number),
    )
    return ProgramDetailOut(
        id=program.id,
        name=program.name,
        duration_weeks=program.duration_weeks,
        workout_count=len(schedule),
        schedule=[
            ProgramSlotOut(
                week_number=slot.week_number,
                day_number=slot.day_number,
                workout=_summary(slot.workout),
            )
            for slot in schedule
        ],
    )


@router.post("/workout/logs", response_model=WorkoutLogOut)
def create_workout_log(
    body: WorkoutLogCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WorkoutLogOut:
    workout = db.get(Workout, body.workout_id)
    if workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    weight_kg = 70.0
    if user.profile and user.profile.weight_kg:
        weight_kg = float(user.profile.weight_kg)
    met = MET_BY_MODALITY.get(workout.modality, 5.0)
    hours = body.duration_min / 60.0
    calories = round(met * weight_kg * hours, 1)
    log = WorkoutLog(
        user_id=user.id,
        workout_id=workout.id,
        duration_min=body.duration_min,
        calories_burned_est=calories,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    gamification = apply_event(db, user.id, "workout")
    db.commit()
    return WorkoutLogOut(
        id=log.id,
        workout_id=log.workout_id,
        duration_min=log.duration_min,
        calories_burned_est=log.calories_burned_est,
        gamification=state_dict(gamification),
    )
