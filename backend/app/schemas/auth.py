from pydantic import BaseModel, EmailStr, Field

from app.models.enums import ActivityLevel, BiologicalSex, EquipmentAccess, Goal


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileUpdate(BaseModel):
    height_cm: float
    weight_kg: float
    biological_sex: BiologicalSex
    goal: Goal
    activity_level: ActivityLevel
    equipment_access: EquipmentAccess


class ProfileOut(BaseModel):
    height_cm: float
    weight_kg: float
    biological_sex: BiologicalSex
    goal: Goal
    activity_level: ActivityLevel
    equipment_access: EquipmentAccess


class UserOut(BaseModel):
    id: str
    email: str
    profile: ProfileOut | None = None
