from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://innerarc:innerarc@localhost:5432/innerarc"
    object_storage_path: str = "../data/photos"
    cors_origins: str = "http://localhost:8081,http://localhost:19006"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"
    jwt_secret: str = "innerarc-dev-secret-change-me-32b+"
    jwt_expire_minutes: int = 10080
    classifier_checkpoint: str = "../ml/checkpoints/best.pt"
    classifier_stub_mode: bool = True
    pose_landmarker_model: str = "../ml/checkpoints/pose_landmarker_lite.task"
    usda_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]


settings = Settings()
