import enum


class BiologicalSex(str, enum.Enum):
    male = "male"
    female = "female"


class Goal(str, enum.Enum):
    fat_loss = "fat_loss"
    muscle_gain = "muscle_gain"
    recomposition = "recomposition"
    endurance = "endurance"
    general_fitness = "general_fitness"


class ActivityLevel(str, enum.Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    very_active = "very_active"
    extra_active = "extra_active"


class EquipmentAccess(str, enum.Enum):
    none = "none"
    home_gym = "home_gym"
    full_gym = "full_gym"


class WorkoutModality(str, enum.Enum):
    bodyweight = "bodyweight"
    weighted = "weighted"
    home_gym = "home_gym"
    yoga = "yoga"
    aerobics = "aerobics"


class WorkoutLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class WearableSource(str, enum.Enum):
    health_connect = "health_connect"
    apple_healthkit = "apple_healthkit"


class MetricType(str, enum.Enum):
    steps = "steps"
    heart_rate = "heart_rate"
    sleep = "sleep"
    spo2 = "spo2"


class ReminderType(str, enum.Enum):
    log_meal = "log_meal"
    workout = "workout"
    progress_photo = "progress_photo"


class ReminderRecurrence(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    custom = "custom"


class CalorieTargetSource(str, enum.Enum):
    calculated = "calculated"
    ai_adjusted = "ai_adjusted"
