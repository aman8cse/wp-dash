import React from 'react';
import {
  Info,
  Server,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          System Architecture, Methodology & Specifications
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Technical briefing and documentation for the UK Wholesale Power Procurement Decision Support Platform.
        </p>
      </div>

      {/* Problem Statement Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-3">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          The Client Challenge: Day-Ahead Market Procurement
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          The client is an energy utility in the United Kingdom responsible for purchasing electricity from the wholesale market (N2EX / EPEX SPOT) to meet customer demand.
          Because renewable generation—specifically wind—is stochastic and weather-dependent, power purchase decisions for delivery day <code className="text-xs bg-background px-1.5 py-0.5 rounded border border-border">D</code> must be executed on day <code className="text-xs bg-background px-1.5 py-0.5 rounded border border-border">D-1</code> before the 11:00 UTC auction gate closure.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          Under-estimating wind leads to over-procuring expensive thermal generation; over-estimating wind leaves the utility short, triggering punitive imbalance cashout charges through the Balancing Mechanism.
          This platform equips the trading desk with the latest available forecasts and quantifies error distributions to size optimal procurement buffers.
        </p>
      </div>

      {/* Data Pipeline & Architecture */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          Data Sources & Ingestion Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg border border-border bg-background space-y-2">
            <div className="flex items-center justify-between font-semibold text-text-primary">
              <span className="flex items-center gap-1.5 text-wind">
                <Database className="h-3.5 w-3.5" /> Elexon BMRS FUELHH
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-wind/10 text-wind rounded">
                Outturn Actuals
              </span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Realized half-hourly wind generation (MW) across 48 settlement periods per day. Filtered for <code className="bg-surface px-1 rounded">fuelType = "WIND"</code>.
            </p>
            <p className="font-mono text-[11px] text-text-muted">
              GET /datasets/FUELHH/stream
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-background space-y-2">
            <div className="flex items-center justify-between font-semibold text-text-primary">
              <span className="flex items-center gap-1.5 text-primary">
                <Database className="h-3.5 w-3.5" /> Elexon BMRS WINDFOR
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                Forecast Vintages
              </span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Multi-vintage National Grid ESO wind forecasts published ~8 times daily. We preserve full publication history (<code className="bg-surface px-1 rounded">publishTime</code>) to conduct vintage lead-time analysis.
            </p>
            <p className="font-mono text-[11px] text-text-muted">
              GET /datasets/WINDFOR/stream
            </p>
          </div>
        </div>
      </div>

      {/* Decision-Relevant Selection Methodology */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-3">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-wind" />
          Day-Ahead Gate Closure Methodology
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          For each half-hour delivery target <code className="text-xs bg-background px-1.5 py-0.5 rounded border border-border">startTime</code>, the platform executes a deterministic selection rule:
        </p>
        <div className="p-3.5 rounded-lg border border-border bg-background font-mono text-xs text-text-primary space-y-1">
          <p className="text-primary">// Decision Forecast Selection Algorithm</p>
          <p>Target Date: D</p>
          <p>Gate Closure Cutoff: D - 1 Day @ 11:00:00 UTC</p>
          <p>Selection: argmax(publishTime) WHERE publishTime &lt;= Cutoff AND startTime in Target Date</p>
        </div>
        <p className="text-xs text-text-secondary">
          This matches the real-world operational condition: the trader cannot see forecasts published after 11:00 UTC on D-1 when submitting their exchange orders.
        </p>
      </div>

      {/* Technical Stack */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-3">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          Technology Architecture
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-border bg-background">
            <p className="font-semibold text-text-primary mb-1">Frontend</p>
            <p className="text-text-secondary">React 18, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, TanStack Query</p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background">
            <p className="font-semibold text-text-primary mb-1">Backend</p>
            <p className="text-text-secondary">Python 3.11, FastAPI, Pandas, NumPy, HTTPX (async), Pydantic v2, APScheduler</p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background">
            <p className="font-semibold text-text-primary mb-1">DevOps</p>
            <p className="text-text-secondary">Multi-stage Docker, Nginx reverse proxy, Docker Compose, GitHub Actions CI</p>
          </div>
        </div>
      </div>
    </div>
  );
};
