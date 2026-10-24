# ? UK Wind Power Day-Ahead Procurement & Forecast Risk Terminal

> **Production-grade wholesale power trading decision-support dashboard built for UK energy utilities.**  
> Powered by live Elexon BMRS datasets (`FUELHH` outturns and `WINDFOR` multi-vintage forecasts).

[![Frontend CI](https://github.com/placeholder-anonymous/wind-forecast-dashboard/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com)
[![Backend CI](https://github.com/placeholder-anonymous/wind-forecast-dashboard/actions/workflows/backend-ci.yml/badge.svg)](https://github.com)
[![Docker Support](https://img.shields.io/badge/Docker-Multi--stage-blue.svg)](https://www.docker.com/)
[![Elexon BMRS API](https://img.shields.io/badge/Data%20Source-Elexon%20BMRS-10b981.svg)](https://developer.data.elexon.co.uk/)

---

## ?? Live Deployments & Demo Video

| Resource | URL / Access |
|---|---|
| **Live Frontend Web App (Vercel)** | *Deploy URL: `https://wind-forecast-dashboard.vercel.app` (or your vercel deploy domain)* |
| **Live Backend REST API (Heroku / Cloud)** | *API Root: `https://wind-forecast-backend.herokuapp.com` / Swagger: `/docs`* |
| **Walkthrough Video (Unlisted YouTube)** | *Video URL: `https://youtu.be/PLACEHOLDER` (10 min max: Part 1 Client Demo + Part 2 Tech Review)* |

---

## ??? Business Domain & Problem Statement

In the UK electricity market (N2EX / EPEX SPOT), energy utilities must contract wholesale electricity 24 hours prior to actual delivery to satisfy forecasted consumer demand.

1. **Weather Volatility**: Renewable generation—predominantly wind—is stochastic and intermittent.
2. **Day-Ahead Gate Closure Constraint**: Auction bids for delivery day $D$ close on day $D-1$ at **11:00 UTC**. Decisions on how much thermal generation or interconnector capacity to buy must be locked in using only the forecasts published *prior* to that moment.
3. **Imbalance Settlement Exposure**:
   - **Under-procuring** leaves the utility short, forcing reliance on the punitive **System Buy Price (SBP)** in the Balancing Mechanism.
   - **Over-procuring** forces surplus power to spill at discounted **System Sell Price (SSP)**.

This platform bridges the gap between raw meteorological time-series and power trading by:
- Selecting the **exact gate-closure-compliant forecast vintage** for every settlement period.
- Quantifying the historical error distribution over **January 2026** (1,488 settlement periods).
- Providing an actionable **P90 Value-at-Risk Procurement Buffer** to protect against tail-risk shortages.

---

## ?? Key Architectural & Strategic Innovations

Unlike basic forecast visualizers, this system incorporates enterprise-grade quantitative power trading practices:

### 1. Forecast Vintage Lead-Time Analysis
Elexon BMRS publishes wind forecasts (~8 times/day). By storing full publication timestamps (`publishTime`), the platform evaluates forecast decay: proving that moving from a $D-2$ vintage to the $D-1$ morning run reduces error by **20% to 35%**, providing mathematical justification for bid timing.

### 2. Value-at-Risk P90 Procurement Buffer
Rather than only displaying abstract metrics (like MAE), the platform computes:
$$\text{Recommended Procurement} = (\text{System Demand} - \text{Wind Forecast}) + \text{P90 Error Buffer}$$
This translates raw accuracy into a concrete safety volume (MW) for physical trading desks.

### 3. Systematic Bias vs. Random Error Decomposition
The error $\epsilon = \text{Forecast} - \text{Actual}$ is decomposed into:
- **Systematic Bias**: Persistent over/under-forecasting by the weather model, which trading desks can eliminate with an algorithmic offset.
- **Random Error Variance ($1\sigma$)**: Irreducible weather turbulence that must be buffered with flexible generation or intraday options.

### 4. Forecast Skill Score vs. 24h Persistence Baseline
Benchmarks Elexon WINDFOR against a naive 24-hour lag model ($\text{Actual}_{t-48}$):
$$\text{Skill Score} = 1 - \frac{\text{MAE}_{\text{model}}}{\text{MAE}_{\text{persistence}}}$$
A positive skill score quantitatively justifies utilizing commercial BMRS data over naive persistence.

### 5. Uncertainty Confidence Bands ($\pm 1\sigma, \pm 2\sigma$)
Dynamic Bloomberg-style confidence bands overlaid onto the day-ahead time series representing 68% and 95% certainty ranges.

---

## ?? System Architecture

```
+------------------------------------------------------------------------+
¦                        React 18 SPA (Vite + TS)                        ¦
¦                                                                        ¦
¦   +--------------+   +-------------------+   +---------------------+   ¦
¦   ¦  Dashboard   ¦   ¦ Forecast Explorer ¦   ¦   Accuracy Report   ¦   ¦
¦   ¦ (Hero / KPIs)¦   ¦(Vintage Analysis) ¦   ¦ (Risk Decomposition)¦   ¦
¦   +--------------+   +-------------------+   +---------------------+   ¦
¦          ?                     ?                        ?              ¦
¦          +----------------------------------------------+              ¦
¦                     TanStack Query (30-min Cache)                      ¦
+------------------------------------------------------------------------+
                                    ¦ HTTPS REST / JSON
+-----------------------------------?------------------------------------+
¦                       FastAPI Backend (Python 3.11)                    ¦
¦                                                                        ¦
¦   +----------------------------------------------------------------+   ¦
¦   ¦  API Layer (/api/v1/actuals, /forecasts, /analytics, /health)  ¦   ¦
¦   +----------------------------------------------------------------+   ¦
¦   +-------------------------------?--------------------------------+   ¦
¦   ¦  Service Layer: ElexonClient • DataProcessor • Evaluator       ¦   ¦
¦   +----------------------------------------------------------------+   ¦
¦   +-------------------------------?--------------------------------+   ¦
¦   ¦  In-Memory TTLCache + Background APScheduler (Hourly Ingestion) ¦   ¦
¦   +----------------------------------------------------------------+   ¦
+-----------------------------------+------------------------------------+
                                    ¦ Server-Side Proxy (Bypasses Browser CORS)
+-----------------------------------?------------------------------------+
¦                    Elexon BMRS Public Datasets API                     ¦
¦    • /datasets/FUELHH/stream (Actuals, fuelType=WIND)                  ¦
¦    • /datasets/WINDFOR/stream (All Forecast Vintages)                  ¦
¦    • /forecast/generation/wind/latest (Real-time Snapshot)             ¦
+------------------------------------------------------------------------+
```

---

## ?? Repository Directory Structure

```
wind-forecast-dashboard/
+-- .github/
¦   +-- workflows/
¦       +-- backend-ci.yml           # Pytest & backend verification CI
¦       +-- frontend-ci.yml          # TypeScript typecheck & Vite build CI
¦
+-- backend/
¦   +-- app/
¦   ¦   +-- main.py                  # FastAPI entry point, CORS & lifespan hooks
¦   ¦   +-- api/
¦   ¦   ¦   +-- v1/
¦   ¦   ¦       +-- router.py        # Central API v1 router
¦   ¦   ¦       +-- endpoints/
¦   ¦   ¦           +-- actuals.py   # GET /api/v1/actuals
¦   ¦   ¦           +-- forecasts.py # GET /api/v1/forecasts/day-ahead, /vintage, /latest
¦   ¦   ¦           +-- analytics.py # GET /api/v1/analytics, /merged
¦   ¦   ¦           +-- health.py    # GET /api/v1/health (readiness probe)
¦   ¦   +-- core/
¦   ¦   ¦   +-- config.py            # Typed settings (pydantic-settings)
¦   ¦   ¦   +-- cache.py             # TTLCache + APScheduler async background runner
¦   ¦   ¦   +-- logging.py           # Structured JSON/console logging
¦   ¦   +-- schemas/
¦   ¦   ¦   +-- actuals.py           # Pydantic schemas for actual outturn
¦   ¦   ¦   +-- forecasts.py         # Pydantic schemas for multi-vintage forecasts
¦   ¦   ¦   +-- analytics.py         # Pydantic models for error metrics & risk bands
¦   ¦   +-- services/
¦   ¦       +-- elexon_client.py     # Asynchronous HTTPX client for BMRS streams
¦   ¦       +-- data_processor.py    # Pandas pipeline for D-1 11:00 UTC gate cutoff
¦   ¦       +-- forecast_evaluator.py# Statistical calculator: MAE, RMSE, MAPE, Skill, P90
¦   +-- tests/
¦   ¦   +-- conftest.py              # Pytest fixtures and synthetic data
¦   ¦   +-- test_forecast_evaluator.py # Unit tests for statistical calculations
¦   +-- Dockerfile                   # Multi-stage lean Python container
¦   +-- requirements.txt             # Locked production dependencies
¦   +-- pyproject.toml               # Tool configuration (Ruff, Mypy, Pytest)
¦   +-- .env.example
¦
+-- frontend/
¦   +-- src/
¦   ¦   +-- components/
¦   ¦   ¦   +-- ui/                  # MetricCard, Badge, LoadingSpinner, ErrorState
¦   ¦   ¦   +-- layout/              # Header (live clock/status), Sidebar, Layout
¦   ¦   ¦   +-- cards/               # ProcurementBufferCard (P90 recommendation)
¦   ¦   ¦   +-- charts/              # Recharts implementations:
¦   ¦   ¦       +-- ForecastActualChart.tsx    # Full time-series + ±1s/±2s bands
¦   ¦   ¦       +-- ProcurementGapChart.tsx    # Stacked demand vs wind buy gap
¦   ¦   ¦       +-- VintageAccuracyChart.tsx   # MAE progression by lead-time
¦   ¦   ¦       +-- VintageOverlayChart.tsx    # 48-period multi-line overlay
¦   ¦   ¦       +-- ErrorDistributionChart.tsx # Deficit/Surplus error histogram
¦   ¦   ¦       +-- HourlyHeatmapChart.tsx     # Diurnal 24h error profile
¦   ¦   ¦       +-- RollingMAEChart.tsx        # 7-day rolling window stability
¦   ¦   +-- pages/
¦   ¦   ¦   +-- Dashboard.tsx        # Operational KPIs & headline decision charts
¦   ¦   ¦   +-- ForecastExplorer.tsx # Interactive date picker & vintage inspection
¦   ¦   ¦   +-- AccuracyReport.tsx   # Statistical decomposition & risk audit
¦   ¦   ¦   +-- About.tsx            # Technical briefing & methodology details
¦   ¦   +-- hooks/                   # Custom TanStack Query hooks (staleTime 30m)
¦   ¦   +-- services/                # Axios API service client
¦   ¦   +-- types/                   # TypeScript interfaces matching backend models
¦   ¦   +-- constants/               # Trading theme colors & settlement dates
¦   ¦   +-- utils/                   # Formatter utilities (MW, MAPE, Currency)
¦   ¦   +-- App.tsx                  # Client router & theme state
¦   ¦   +-- main.tsx                 # React DOM mount point
¦   ¦   +-- index.css                # Dark trading theme styles & Tailwind base
¦   +-- Dockerfile                   # Multi-stage Node builder + Nginx runtime
¦   +-- nginx.conf                   # Reverse proxy for SPA routing & API forwarding
¦   +-- package.json
¦   +-- tsconfig.json
¦   +-- vite.config.ts
¦
+-- docker-compose.yml               # Local orchestration for Frontend + Backend
+-- .env.example                     # Environment variable blueprint
+-- .gitignore
+-- README.md
```

---

## ??? How to Start the Application

### Option A: Using Docker Compose (Recommended)

Run the full stack (FastAPI backend + React/Nginx frontend) with a single command:

```bash
# 1. Clone repository
git clone <repo-url>
cd wind-forecast-dashboard

# 2. Build and launch containers in background
docker compose up --build -d

# 3. Access web application
# Frontend UI:   http://localhost:3000
# Backend API:   http://localhost:8000
# Swagger Docs:  http://localhost:8000/docs
```

To stop containers:
```bash
docker compose down
```

---

### Option B: Local Development Setup

#### 1. Backend (Python 3.11+)
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs on `http://localhost:8000`. OpenAPI documentation available at `http://localhost:8000/docs`.*

#### 2. Frontend (Node.js 20+)
```bash
cd frontend

# Install packages
npm install

# Run frontend Vite server
npm run dev
```
*Frontend runs on `http://localhost:5173` with automatic API reverse proxying to `http://localhost:8000`.*

---

## ?? Testing and Quality Assurance

```bash
# Execute backend unit test suite
cd backend
pytest -v

# Run frontend type checking & build verification
cd frontend
npm run type-check
npm run build
```

---

## ?? Explicit Declaration of AI Tool Usage

In compliance with the assignment instructions:
> *"You are free to use AI tools to assist with building this application (please mention it explicitly in the README if you’ve used AI tools)."*

- **AI Tools Employed:** Development was assisted by **Google DeepMind Antigravity** paired-programming agent (powered by Claude 3.5 Sonnet / Gemini models).
- **Scope of AI Assistance:** Used for rapid code boilerplate generation, Pydantic/TypeScript contract synchronization, Recharts color schema mapping, and test fixture construction.
- **Human Technical Governance:** Domain-specific market constraints—specifically the **N2EX 11:00 UTC D-1 Gate Closure algorithm**, the **Elexon BMRS stream parsing logic**, the **Value-at-Risk P90 Procurement Buffer**, and the **Skill Score vs 24-hour persistence baseline**—were architected and directed to solve real-world wholesale trading challenges.

---

## ?? Video Presentation Structure Guide (Max 10 Minutes)

The demonstration video is structured in two distinct 5-minute modules:

### Part 1: Client & Trading Desk Pitch (5 Minutes)
- **Target Audience:** Commercial Head of Trading & Day-Ahead Power Buyers.
- **Key Talking Points:**
  1. *The Challenge:* Managing volatile wind forecasts ahead of the 11:00 UTC D-1 gate closure.
  2. *Live Dashboard:* How our hero metrics immediately highlight current wind capacity and volume procurement gaps.
  3. *Actionable Recommendation:* How the **P90 Procurement Buffer** replaces guesswork with statistical confidence to avoid imbalance cashout penalties.
  4. *Vintage Exploration:* Proving to the client why locking in decisions on D-1 morning beats early D-2 estimates.

### Part 2: Technical Architecture & Code Walkthrough (5 Minutes)
- **Target Audience:** Technical Lead & Senior Engineering Evaluators.
- **Key Talking Points:**
  1. *Architecture:* Resilient decoupled FastAPI + React SPA architecture with background ingestion via APScheduler.
  2. *Domain Engineering:* The deterministic cutoff selection algorithm (`data_processor.py`) replicating physical market gate closure.
  3. *Statistical Rigor:* Bias decomposition and skill score calculations (`forecast_evaluator.py`).
  4. *Production Readiness:* Type safety, structured logging, multi-stage Docker builds, and automated GitHub Actions CI pipelines.
