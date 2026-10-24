"""
Health check endpoint:

  GET /api/v1/health â€” returns HealthResponse
"""

from fastapi import APIRouter

from app.core.cache import get_last_refresh_time, is_cache_populated
from app.core.config import get_settings
from app.core.logging import get_logger
from app.schemas.analytics import HealthResponse
from app.services.elexon_client import ElexonClient

router = APIRouter()
logger = get_logger(__name__)
settings = get_settings()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="API health check",
    tags=["health"],
)
async def health_check() -> HealthResponse:
    """
    Returns:
      - Overall API status
      - Whether the cache has been populated
      - Timestamp of last successful data refresh
      - Whether the Elexon BMRS API is currently reachable
    """
    cache_populated = is_cache_populated()
    last_refresh = get_last_refresh_time()

    # Quick Elexon reachability check
    try:
        async with ElexonClient() as client:
            elexon_reachable = await client.ping()
    except Exception:  # noqa: BLE001
        elexon_reachable = False

    status = "ok" if cache_populated else "degraded"

    logger.info(
        "health.check",
        status=status,
        cache_populated=cache_populated,
        elexon_reachable=elexon_reachable,
    )

    return HealthResponse(
        status=status,
        version=settings.app_version,
        cache_populated=cache_populated,
        last_refresh=last_refresh,
        elexon_reachable=elexon_reachable,
    )
