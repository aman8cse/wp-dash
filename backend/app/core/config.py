from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Wind Forecast Dashboard API"
    app_version: str = "1.0.0"
    debug: bool = False
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    cache_ttl_seconds: int = 3600
    data_from: str = "2026-01-01T00:00:00Z"
    data_to: str = "2026-01-31T23:59:59Z"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
    ]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
