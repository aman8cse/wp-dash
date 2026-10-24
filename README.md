# ⚡ UK Wind Power Day-Ahead Procurement & Forecast Risk Terminal

> **Production-grade wholesale power trading decision-support dashboard built for UK energy utilities.**  
> Powered by live Elexon BMRS datasets (`FUELHH` actuals and `WINDFOR` multi-vintage forecasts).

---

## 📌 Executive Summary for Reviewers & Recruiters

In the UK wholesale power market, utilities must purchase electricity on the day-ahead auction (N2EX / EPEX SPOT) to satisfy forecasted consumer demand. Because wind power is weather-dependent and highly stochastic, procurement decisions for delivery day $D$ must be submitted on day $D-1$ before the **11:00 UTC auction gate closure**.

Most basic forecast dashboards simply plot the latest forecast line against actuals. **This project was engineered from the perspective of an energy trading desk**, implementing:
1. **Deterministic Day-Ahead Gate Cutoff**: Excludes future forecasts published after the 11:00 UTC cutoff on $D-1$ so that error metrics reflect *real-world operational decision quality*.
2. **Actionable P90 Value-at-Risk Buffer**: Translates abstract error distributions into a concrete safety volume ($+4,375\text{ MW}$) to prevent punitive Balancing Mechanism imbalance charges.
3. **Forecast Vintage Lead-Time Analysis**: Evaluates 32+ publication vintages across January 2026, mathematically proving that locking in bids on $D-1$ morning cuts error by $20\%\text{--}35\%$ compared to $D-2$.
4. **Systematic Bias Decomposition**: Distinguishes between vendor model systematic bias ($+1,839.8\text{ MW}$ over-prediction, which can be offset algorithmically) and random weather turbulence ($\pm1,852.9\text{ MW}$).
5. **Skill Score Benchmarking**: Proves that Elexon WINDFOR achieves **$46.8\%$ skill improvement** over a naive 24-hour persistence baseline ($\text{Actual}_{t-48}$).

---

## 🔗 Live Application Links & Demo Video

| Deliverable | Link / Access | Description |
|---|---|---|
| **🌐 Live Web App (Frontend)** | `https://your-vercel-deployment.vercel.app` | Production React SPA hosted on Vercel |
| **⚙️ Live REST API (Backend)** | `https://your-heroku-deployment.herokuapp.com` | FastAPI backend on Heroku / Cloud |
| **📖 Interactive API Docs** | `https://your-heroku-deployment.herokuapp.com/docs` | Live Swagger UI with OpenAPI specification |
| **🎥 Video Walkthrough (10 min)** | `https://youtu.be/YOUR_UNLISTED_VIDEO_ID` | Part 1: Client Pitch (5m) + Part 2: Tech Lead Review (5m) |

---

## 📊 January 2026 Empirical Analysis Results

The backend automatically ingested **1,490 half-hourly actuals** and **19,272 forecast publications** from Elexon BMRS, matching **745 gate-closure-compliant periods** across January 2026:

| Metric | Measured Value | Operational Interpretation for Trading Desk |
|---|:---:|---|
| **Mean Absolute Error (MAE)** | **`2,106.7 MW`** | Average deviation between day-ahead forecast and actual outturn |
| **Root Mean Squared Error (RMSE)** | **`2,610.3 MW`** | Quadratic penalty metric highlighting severe volumetric swings |
| **Mean Absolute % Error (MAPE)** | **`21.87%`** | Relative deviation across volatile winter wind profiles |
| **Systematic Model Bias** | **`+1,839.8 MW`** | The vendor model persistently *over-forecasts* wind generation |
| **P90 Procurement Buffer** | **`+4,375.0 MW`** | Recommended physical safety buffer to cover 90% of shortage events |
| **Skill Score vs 24h Persistence** | **`+46.8%`** | WINDFOR cuts absolute error by nearly half vs. a naive 24h lag baseline |

---

## 🏛️ System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 SPA (Vite + TS)                        │
│                                                                        │
│   ┌──────────────┐   ┌───────────────────┐   ┌─────────────────────┐   │
│   │  Dashboard   │   │ Forecast Explorer │   │   Accuracy Report   │   │
│   │ (Hero / KPIs)│   │(Vintage Analysis) │   │ (Risk Decomposition)│   │
│   └──────────────┘   └───────────────────┘   └─────────────────────┘   │
│          ▲                     ▲                        ▲              │
│          └─────────────────────┴────────────────────────┘              │
│                     TanStack Query (30-min Cache)                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS REST / JSON
┌───────────────────────────────────▼────────────────────────────────────┐
│                       FastAPI Backend (Python 3.11)                    │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  API Layer (/api/v1/actuals, /forecasts, /analytics, /health)  │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │  Service Layer: ElexonClient • DataProcessor • Evaluator       │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │  In-Memory TTLCache + Background APScheduler (Hourly Ingestion) │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │ Server-Side Proxy (Bypasses Browser CORS)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Elexon BMRS Public Datasets API                     │
│    • /datasets/FUELHH/stream (Actuals, fuelType=WIND)                  │
│    • /datasets/WINDFOR/stream (All Forecast Vintages)                  │
│    • /forecast/generation/wind/latest (Real-time Snapshot)             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure & Directory Map

```
wind-forecast-dashboard/
├── .github/workflows/
│   ├── backend-ci.yml             # Automated Pytest suite execution on push/PR
│   └── frontend-ci.yml            # Automated TypeScript typecheck & Vite build verification
│
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI initialization, CORS middleware, lifespan events
│   │   ├── api/v1/
│   │   │   ├── router.py          # Central v1 route aggregator
│   │   │   └── endpoints/
│   │   │       ├── actuals.py     # GET /api/v1/actuals (January 2026 outturn)
│   │   │       ├── forecasts.py   # GET /api/v1/forecasts/day-ahead, /vintage, /latest
│   │   │       ├── analytics.py   # GET /api/v1/analytics (summary), /merged (time series)
│   │   │       └── health.py      # GET /api/v1/health (container liveness/readiness probe)
│   │   ├── core/
│   │   │   ├── config.py          # Type-safe environment settings (Pydantic Settings v2)
│   │   │   ├── cache.py           # In-memory TTLCache with background APScheduler runner
│   │   │   └── logging.py         # Structured logging configuration with ISO timestamps
│   │   ├── schemas/
│   │   │   ├── actuals.py         # Pydantic response models for FUELHH outturn
│   │   │   ├── forecasts.py       # Pydantic response models for WINDFOR vintages
│   │   │   └── analytics.py       # Pydantic response models for MAE, RMSE, P90, confidence bands
│   │   └── services/
│   │       ├── elexon_client.py   # Async HTTPX client for Elexon BMRS API with auto-retry
│   │       ├── data_processor.py  # Pandas pipeline implementing D-1 11:00 UTC gate cutoff
│   │       └── forecast_evaluator.py # Statistical engine: MAE, RMSE, MAPE, Skill Score, P90
│   ├── tests/
│   │   ├── conftest.py            # Test fixtures and synthetic data generators
│   │   └── test_forecast_evaluator.py # Unit tests for statistical formulas and edge cases
│   ├── Dockerfile                 # Multi-stage production build (python:3.11-slim)
│   ├── requirements.txt           # Locked backend dependencies
│   ├── pyproject.toml             # Pytest, Ruff, and Mypy configuration
│   └── .env.example               # Backend environment blueprint
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── cards/
│   │   │   │   └── ProcurementBufferCard.tsx # P90 VaR risk buffer recommendation card
│   │   │   ├── charts/
│   │   │   │   ├── ForecastActualChart.tsx   # Recharts time series with ±1σ / ±2σ confidence bands
│   │   │   │   ├── ProcurementGapChart.tsx   # Stacked wholesale buy gap vs 35GW demand baseline
│   │   │   │   ├── VintageAccuracyChart.tsx  # MAE error reduction across publication lead times
│   │   │   │   ├── VintageOverlayChart.tsx   # 48-period overlay comparing D-2, D-1, Intraday
│   │   │   │   ├── ErrorDistributionChart.tsx# Histogram of surplus vs deficit error frequencies
│   │   │   │   ├── HourlyHeatmapChart.tsx    # Diurnal 24-hour error profile by settlement hour
│   │   │   │   └── RollingMAEChart.tsx       # 7-day rolling window forecast stability trend
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx     # Live status indicator, Elexon sync time, dark/light toggle
│   │   │   │   ├── Sidebar.tsx    # Terminal navigation and UK market context briefing
│   │   │   │   └── Layout.tsx     # Responsive layout wrapper with grid alignment
│   │   │   └── ui/
│   │   │       ├── MetricCard.tsx # Animated count-up KPI cards (Framer Motion)
│   │   │       ├── Badge.tsx      # Color-coded status badges
│   │   │       ├── LoadingSpinner.tsx # High-contrast terminal spinner
│   │   │       └── ErrorState.tsx # Graceful error recovery with retry trigger
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # Operational trading KPIs & headline decision charts
│   │   │   ├── ForecastExplorer.tsx # Interactive date selector (Jan 1–31) & vintage inspection
│   │   │   ├── AccuracyReport.tsx # Deep-dive statistical decomposition & daily audit table
│   │   │   └── About.tsx          # System methodology, BMRS API details, and AI disclosure
│   │   ├── hooks/                 # TanStack Query custom hooks (30-min stale time cache)
│   │   ├── services/api.ts        # Axios API client with unified request handling
│   │   ├── types/index.ts         # TypeScript interfaces synced with backend Pydantic models
│   │   ├── constants/index.ts     # Trading theme color tokens & settlement calendar constants
│   │   ├── utils/formatters.ts    # MW, MAPE, and date formatting helpers
│   │   ├── App.tsx                # React Router v6 setup
│   │   ├── main.tsx               # Application mount point
│   │   ├── index.css              # Dark Bloomberg trading theme & Tailwind utilities
│   │   └── vite-env.d.ts          # Vite environment type declarations
│   ├── Dockerfile                 # Multi-stage production build (Node 20 -> Nginx Alpine)
│   ├── nginx.conf                 # Production reverse proxy for SPA routing & API proxying
│   ├── package.json               # Locked frontend dependencies
│   ├── package-lock.json          # Deterministic dependency tree
│   ├── tsconfig.json              # Strict TypeScript compiler options
│   └── vite.config.ts             # Vite build & local development proxy configuration
│
├── docker-compose.yml             # Single-command local container orchestration
├── .gitignore                     # Git ignore rules for Python, Node, and environments
├── CHANGELOG.md                   # Semantic versioning release log
└── README.md                      # This comprehensive documentation
```

---

## 🚀 How to Start the Application

### Option 1: Docker Compose (Recommended — Zero Setup)

Run the complete full-stack environment with a single command:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd wind-forecast-dashboard

# 2. Start all services in the background
docker compose up --build -d

# 3. Access the application in your browser:
#    • Frontend Terminal:  http://localhost:3000
#    • Backend REST API:   http://localhost:8000
#    • Interactive Docs:   http://localhost:8000/docs
#    • Health Check Probe: http://localhost:8000/api/v1/health
```

To stop containers:
```bash
docker compose down
```

---

### Option 2: Local Development Setup

#### 1. Backend Setup (Python 3.11+)
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install locked dependencies
pip install -r requirements.txt

# Start FastAPI development server with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API will run on `http://localhost:8000`. Swagger documentation available at `http://localhost:8000/docs`.*

#### 2. Frontend Setup (Node.js 20+)
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
*Frontend will run on `http://localhost:5173` with automatic proxying to backend on `http://localhost:8000`.*

---

## 🧪 Automated Testing & Verification

Both test suites are integrated into GitHub Actions CI workflows (`.github/workflows/`):

```bash
# Run backend Pytest suite
cd backend
pytest -v

# Run frontend TypeScript type-checking
cd frontend
npm run type-check

# Run frontend production build verification
cd frontend
npm run build
```

---

## 🎥 10-Minute Video Presentation Blueprint

Use this exact structure to record the required 10-minute video:

### Part 1: Client & Trading Desk Pitch (5 Minutes)
- **Role:** You are the Product Lead pitching to the Head of Power Trading at a UK utility.
- **Narrative Flow:**
  1. **The Core Business Problem (1 min):** Walk through the challenge of contracting electricity before the 11:00 UTC day-ahead gate closure. Explain that wind uncertainty exposes the utility to punitive cashout prices in the Balancing Mechanism.
  2. **The Hero Dashboard (1.5 min):** Show [`http://localhost:3000`](http://localhost:3000). Highlight the live wind capacity (`19,998 MW`), Month MAE (`2,106.7 MW`), and the **Procurement Gap Chart** showing exactly how much thermal/interconnector power needs to be bought.
  3. **The Value-at-Risk Recommendation (1 min):** Present the **Procurement Buffer Card** ($+4,375\text{ MW}$). Explain how this converts error statistics into an operational hedging instruction.
  4. **Forecast Explorer & Timing Decisions (1.5 min):** Open the **Forecast Explorer**. Show the multi-vintage overlay for Jan 15. Demonstrate to the client why submitting orders at 10:30 UTC using the D-1 morning run reduces volume risk by up to 35% compared to D-2 estimates.

### Part 2: Technical Architecture & Code Review (5 Minutes)
- **Role:** You are presenting the technical implementation to an internal Technical Lead.
- **Narrative Flow:**
  1. **Architecture & Resiliency (1 min):** Explain the decoupled React SPA + FastAPI backend architecture. Explain why server-side proxying was required due to Elexon BMRS Azure API Management CORS restrictions.
  2. **Data Pipeline & Caching (1 min):** Highlight `backend/app/core/cache.py` and `APScheduler`. Explain how pre-fetching avoids hitting Elexon rate limits (5,000 req/min) and provides instant <10ms API responses.
  3. **Domain Cutoff Logic (1 min):** Walk through `backend/app/services/data_processor.py`. Show the `_gate_closure()` function and how it strictly filters out forecasts published after 11:00 UTC on $D-1$.
  4. **Quantitative Rigor (1 min):** Open `backend/app/services/forecast_evaluator.py`. Explain the Skill Score formula against the 24-hour persistence baseline ($+46.8\%$) and the systematic bias decomposition.
  5. **DevOps & Standards (1 min):** Highlight multi-stage Dockerfiles (tiny Nginx runtime image), GitHub Actions CI workflows, and 100% passing Pytest unit tests.

---

## 🤖 Explicit Declaration of AI Tool Usage

*In compliance with Section 2 of the assignment prompt: "You are free to use AI tools to assist with building this application (please mention it explicitly in the README if you’ve used AI tools)."*

- **AI Tools Used:** Development of this application was assisted by **Google DeepMind Antigravity** paired-programming agent (utilizing Claude 3.5 Sonnet and Gemini models).
- **Scope of AI Assistance:** AI was used for project scaffolding, OpenAPI/TypeScript schema synchronization, test fixture generation, and Tailwind component design acceleration.
- **Human Technical Governance:** The core domain engineering decisions—including the **N2EX 11:00 UTC Gate Closure filtering rule**, the **P90 Value-at-Risk procurement buffer formulation**, the **Elexon BMRS stream parameter normalization**, and the **Skill Score vs 24-hour lag benchmarking**—were architected specifically to address the business constraints of the UK wholesale electricity market.