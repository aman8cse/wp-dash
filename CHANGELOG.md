# Changelog

All notable changes to the **UK Wind Power Day-Ahead Procurement & Forecast Risk Terminal** are documented in this file.

The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-24

### Added
- **Core Market Ingestion**:
  - Asynchronous HTTPX client for Elexon BMRS `FUELHH` outturn and `WINDFOR` multi-vintage forecast streams.
  - In-memory `TTLCache` coupled with asynchronous background `APScheduler` runner (1-hour auto-refresh).
  - Deterministic gate-closure selection algorithm implementing the UK N2EX $D-1$ 11:00 UTC auction cutoff.

- **Quantitative Analytics & Risk Engine**:
  - Headline accuracy evaluation: MAE, RMSE, MAPE, Bias, and P90 tail risk error.
  - Skill Score evaluation benchmarked against 24-hour lag persistence baseline ($\text{Actual}_{t-48}$).
  - Systematic bias vs stochastic random variance decomposition.
  - Diurnal sensitivity profiling (settlement hours 0–23 UTC) and 7-day rolling MAE window analysis.
  - Value-at-Risk (VaR) P90 procurement buffer recommendation algorithm.

- **Trading Desk User Interface**:
  - Dark Bloomberg/trading terminal aesthetic with electric blue/green accent scheme and light mode toggle.
  - **Dashboard**: Real-time snapshot, headline KPI cards, full January 2026 time-series chart with dynamic $\pm1\sigma/\pm2\sigma$ uncertainty bands, and stacked wholesale procurement gap chart.
  - **Forecast Explorer**: Interactive delivery date picker (January 1–31, 2026) with multi-vintage overlay chart and lead-time analysis.
  - **Accuracy Report**: Deep-dive error distribution histogram, diurnal heatmap, and daily audit table.
  - **Methodology & About**: Comprehensive domain briefing, API documentation, and AI tooling disclosure.

- **Enterprise & DevOps Standards**:
  - Multi-stage Dockerfiles for frontend (`node:20-alpine` -> `nginx:alpine`) and backend (`python:3.11-slim`).
  - Docker Compose orchestration with health check probes.
  - GitHub Actions CI workflows for automated Pytest unit testing and TypeScript/Vite compilation.
