from fastapi import APIRouter

from app.api.v1.endpoints import actuals, analytics, forecasts, health

api_router = APIRouter()

api_router.include_router(actuals.router, prefix="/actuals", tags=["actuals"])
api_router.include_router(forecasts.router, prefix="/forecasts", tags=["forecasts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(health.router, tags=["health"])
