from app.models.enums import ActivityLevel, BiologicalSex, Goal
from app.models.user import UserProfile

ACTIVITY_MULTIPLIER = {
    ActivityLevel.sedentary: 1.2,
    ActivityLevel.lightly_active: 1.375,
    ActivityLevel.moderately_active: 1.55,
    ActivityLevel.very_active: 1.725,
    ActivityLevel.extra_active: 1.9,
}

# Responsible-design cap: never more than a 20% calorie deficit.
MAX_DEFICIT_FRACTION = 0.20


def mifflin_st_jeor_bmr(profile: UserProfile) -> float:
    if profile.biological_sex == BiologicalSex.male:
        return 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * 30 + 5
    return 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * 30 - 161


def calculate_targets(profile: UserProfile) -> dict[str, int]:
    bmr = mifflin_st_jeor_bmr(profile)
    tdee = bmr * ACTIVITY_MULTIPLIER[profile.activity_level]
    if profile.goal == Goal.fat_loss:
        calories = tdee * (1 - MAX_DEFICIT_FRACTION)
    elif profile.goal == Goal.muscle_gain:
        calories = tdee * 1.10
    else:
        calories = tdee
    calories = max(1200, round(calories))
    protein_g = round(1.8 * profile.weight_kg)
    fat_g = round((0.28 * calories) / 9)
    carbs_g = max(0, round((calories - protein_g * 4 - fat_g * 9) / 4))
    return {
        "target_calories": calories,
        "target_protein_g": protein_g,
        "target_carbs_g": carbs_g,
        "target_fat_g": fat_g,
    }
