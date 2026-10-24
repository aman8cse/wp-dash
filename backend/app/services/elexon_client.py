"""
Elexon BMRS API async client.

Provides:
  fetch_wind_actuals(from_dt, to_dt) -> list[dict]
  fetch_wind_forecasts(from_dt, to_dt) -> list[dict]
  fetch_latest_forecast() -> list[dict]

Uses httpx.AsyncClient with a single retry on 5xx responses.
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

_TIMEOUT = httpx.Timeout(30.0, connect=10.0)
_RETRY_STATUSES = {500, 502, 503, 504}


class ElexonClient:
    """Async context-manager wrapper around httpx.AsyncClient for the Elexon BMRS API."""

    def __init__(self) -> None:
        self._base_url = settings.elexon_base_url.rstrip("/")
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "ElexonClient":
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            timeout=_TIMEOUT,
            headers={"Accept": "application/json"},
            follow_redirects=True,
        )
        return self

    async def __aexit__(self, *args: Any) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get(self, path: str, params: dict | None = None) -> list[dict]:
        """
        Perform a GET request and return the JSON body.

        Retries once on 5xx responses. Returns an empty list on failure
        rather than propagating the exception (caller should check length).
        """
        assert self._client is not None, "Use ElexonClient as async context manager"

        url = path
        attempt = 0

        while attempt < 2:
            attempt += 1
            t0 = time.perf_counter()
            try:
                response = await self._client.get(url, params=params)
                elapsed = (time.perf_counter() - t0) * 1000

                logger.info(
                    "elexon.request",
                    path=path,
                    params=params,
                    status=response.status_code,
                    elapsed_ms=round(elapsed, 1),
                    attempt=attempt,
                )

                if response.status_code in _RETRY_STATUSES and attempt == 1:
                    logger.warning(
                        "elexon.retry",
                        path=path,
                        status=response.status_code,
                    )
                    continue

                response.raise_for_status()
                data = response.json()

                # Elexon returns either a top-level list or {"data": [...]}
                if isinstance(data, list):
                    return data
                if isinstance(data, dict):
                    # Try common envelope keys
                    for key in ("data", "items", "results"):
                        if key in data and isinstance(data[key], list):
                            return data[key]
                    # If no recognised envelope, return empty list with a warning
                    logger.warning("elexon.unexpected_shape", path=path, keys=list(data.keys()))
                    return []

                logger.warning("elexon.unexpected_type", path=path, type=type(data).__name__)
                return []

            except httpx.HTTPStatusError as exc:
                elapsed = (time.perf_counter() - t0) * 1000
                logger.error(
                    "elexon.http_error",
                    path=path,
                    status=exc.response.status_code,
                    elapsed_ms=round(elapsed, 1),
                    error=str(exc),
                )
                if exc.response.status_code in _RETRY_STATUSES and attempt == 1:
                    continue
                return []

            except httpx.RequestError as exc:
                elapsed = (time.perf_counter() - t0) * 1000
                logger.error(
                    "elexon.request_error",
                    path=path,
                    elapsed_ms=round(elapsed, 1),
                    error=str(exc),
                )
                return []

        return []

    # ------------------------------------------------------------------
    # Public API methods
    # ------------------------------------------------------------------

    async def fetch_wind_actuals(self, from_dt: str, to_dt: str) -> list[dict]:
        """
        Fetch half-hourly wind generation actuals (FUELHH dataset).

        Parameters
        ----------
        from_dt : ISO 8601 string, e.g. "2026-01-01T00:00:00Z"
        to_dt   : ISO 8601 string, e.g. "2026-01-31T23:59:59Z"
        """
        logger.info("elexon.fetch_actuals.start", from_dt=from_dt, to_dt=to_dt)
        records = await self._get(
            "/datasets/FUELHH/stream",
            params={
                "publishDateTimeFrom": from_dt,
                "publishDateTimeTo": to_dt,
                "fuelType": "WIND",
            },
        )
        logger.info("elexon.fetch_actuals.done", records=len(records))
        return records

    async def fetch_wind_forecasts(self, from_dt: str, to_dt: str) -> list[dict]:
        """
        Fetch wind generation forecasts (WINDFOR dataset) by publish date range.

        Parameters
        ----------
        from_dt : publishDateTimeFrom, e.g. "2025-12-30T00:00:00Z"
        to_dt   : publishDateTimeTo,   e.g. "2026-01-31T23:59:59Z"
        """
        logger.info("elexon.fetch_forecasts.start", from_dt=from_dt, to_dt=to_dt)
        records = await self._get(
            "/datasets/WINDFOR/stream",
            params={
                "publishDateTimeFrom": from_dt,
                "publishDateTimeTo": to_dt,
            },
        )
        logger.info("elexon.fetch_forecasts.done", records=len(records))
        return records

    async def fetch_latest_forecast(self) -> list[dict]:
        """
        Fetch the latest available wind generation forecast from Elexon's live endpoint.
        """
        logger.info("elexon.fetch_latest_forecast.start")
        now = datetime.now(timezone.utc)
        from_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")
        to_str = (now + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
        records = await self._get(
            "/forecast/generation/wind/latest",
            params={"from": from_str, "to": to_str},
        )
        logger.info("elexon.fetch_latest_forecast.done", records=len(records))
        return records

    async def ping(self) -> bool:
        """
        Quick reachability check â€” fetches a tiny slice of data.
        Returns True if Elexon responds with any HTTP 2xx.
        """
        assert self._client is not None, "Use ElexonClient as async context manager"
        try:
            response = await self._client.get(
                "/datasets/FUELHH/stream",
                params={
                    "from": "2026-01-01T00:00:00Z",
                    "to": "2026-01-01T00:30:00Z",
                    "fuelType": "WIND",
                },
            )
            return response.is_success
        except Exception:  # noqa: BLE001
            return False
