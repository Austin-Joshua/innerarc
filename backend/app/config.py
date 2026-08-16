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
    anthropic_api_key: str = ""
    jwt_secret: str = "innerarc-dev-secret-change-me-32b+"
    jwt_expire_minutes: int = 10080
    classifier_checkpoint: str = "../ml/checkpoints/best.pt"
    classifier_stub_mode: bool = True
    usda_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
