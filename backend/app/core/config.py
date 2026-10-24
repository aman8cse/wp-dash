from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Wind Forecast Dashboard API"
    app_version: str = "1.0.0"
    debug: bool = False
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    cache_ttl_seconds: int = 3600
    data_from: str = "2026-01-01T00:00:00Z"
    data_to: str = "2026-02-01T00:30:00Z"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
