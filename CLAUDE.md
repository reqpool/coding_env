# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repo will become the **Estimation Manager** — a web app that replaces an Excel-based software project estimation tool. It takes project parameters, runs a calibratable estimation engine, and exposes results via a UI and a REST API.

The full technical specification is in `SPEC_Estimation_Manager.md` (German). Key decisions are marked **[ENTSCHIEDEN]** (locked); open choices are marked **[OFFEN]** (free to decide during implementation).

## Tech Stack

- **Runtime/Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 (strict)
- **Styling/UI:** Tailwind CSS 4, shadcn/ui (on Base UI)
- **Validation:** Zod 4 — single source of truth for all types, form validation, and API contracts
- **ORM/DB:** Drizzle ORM + PostgreSQL 16 (JSONB for parameter/result blobs)
- **Auth:** Better Auth (self-hosted, data in own DB)
- **Charts:** Recharts
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Package manager:** pnpm
- **Deployment:** Docker (multi-stage, `output: 'standalone'`) + docker-compose

## Repository Layout

```
coding_env/               ← git root
├── estimation-manager/   ← Next.js app (all commands run from here)
├── AGENTS.md             ← AI-development conventions
├── CLAUDE.md
└── SPEC_Estimation_Manager.md
```

## Commands

All commands run from `estimation-manager/`:

```bash
pnpm dev              # start dev server (Turbopack)
pnpm build            # production build
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit

pnpm test             # Vitest unit tests
pnpm test src/lib/engine/__tests__/compute.test.ts   # run a single test file
pnpm test:e2e         # Playwright E2E

pnpm db:migrate       # drizzle-kit migrate
pnpm db:seed          # seed default calibration profile
pnpm db:studio        # Drizzle Studio
```

## Architecture

### Layers

```
Presentation     React Server + Client Components, shadcn/ui
Application      Server Actions (internal) + Route Handlers /api/v1 (external)
Domain           Estimation Engine — pure TS, zero I/O
Infrastructure   Drizzle + PostgreSQL, Better Auth, PDF/XLSX export
```

### The Estimation Engine (`src/lib/engine/`)

The engine is the core of the system. It is a **pure, side-effect-free TypeScript module** — no database, no HTTP, no Next.js imports. Signature:

```ts
computeEstimation(input: EstimationInput, profile: CalibrationProfile): EstimationResult
```

The engine runs identically from Server Actions (live preview), the internal UI, and the external REST API. This is a hard architectural constraint. The engine's 9 calculation steps are:

1. Raw Function Points from 8 cost drivers (masks, useCases, businessObjects, interfaces, batches, roles) with complexity weights (low/medium/high)
2. Value Adjustment Factor (VAF) from optional non-functional factors (0–5 scale)
3. Scale factor from `users` (bucketed) and `languages`
4. Effort in person-days (non-linear, COCOMO-like): `effortPD = productivity × (adjustedFP × scaleFactor) ^ scaleExponent × (1 + contingencyPct)`
5. Phase distribution (5 default phases, configurable in profile, must sum to 100%)
6. Role distribution (5 default roles, configurable in profile, must sum to 100%)
7. Cost by role (roleEffort × dailyRate)
8. Duration: capacity-based and nominal (COCOMO schedule), output is `max(capacity, nominal)`
9. Uncertainty band: low/expected/high at ±30% (default)

**Determinism is required:** identical `input` + `profile` must produce bit-identical output. No `Date.now()`, `Math.random()`, or locale-dependent operations in the engine.

Engine unit tests use the **Golden-Master pattern** — fixed input fixtures → expected result snapshots. Any formula change requires a deliberate fixture update.

### Zod Contracts (`src/lib/contracts/`)

All data shapes live here as Zod schemas: `EstimationInput`, `EstimationResult`, `CalibrationProfile`. Types are derived via `z.infer`. These schemas are the single source of truth for the engine, Server Actions, Route Handlers, form validation, and OpenAPI generation. Never duplicate type definitions elsewhere.

### Snapshot Principle

When an estimation is saved, `input`, `result`, `engine_version`, and `profile_version` are frozen in the `estimations` table as JSONB snapshots. Subsequent changes to calibration profiles do **not** retroactively alter saved estimations. This guarantees reproducibility and benchmark comparability.

### API Surface

- **Internal:** Server Actions in `src/app/actions/` — typed mutations for UI (create/save/duplicate estimations, manage projects)
- **External:** Route Handlers at `/api/v1/` — stateless `POST /api/v1/estimate`, `GET /api/v1/profiles`, `GET /api/v1/estimations/:id`; authenticated via `X-API-Key` header
- OpenAPI 3.1 spec generated from Zod schemas, served at `/api/v1/openapi.json`

No tRPC. Server Actions cover internal TS consumers; Route Handlers cover external integrators.

### Project Structure

Inside `estimation-manager/`:

```
src/
  app/
    (app)/              # authenticated pages (dashboard, wizard, results, admin)
    api/v1/             # external REST endpoints
    api/health/         # GET /api/health → { status, timestamp }
    actions/            # Server Actions
  lib/
    engine/             # pure estimation engine (NO I/O)
      compute.ts        # entry: computeEstimation(input, profile)
      steps/*.ts        # one file per calculation step
      engine-version.ts # ENGINE_VERSION constant
      __tests__/        # Golden-Master unit tests
    contracts/          # Zod schemas = single source of truth
    db/                 # Drizzle schema, client, migrations, seed
    auth/               # Better Auth setup
    export/             # PDF/XLSX generators
  components/           # UI components (shadcn/ui on Base UI)
drizzle/                # migration files
tests/e2e/              # Playwright
docker/                 # Dockerfile, docker-compose.yml, .env.example
openapi/                # generated openapi.json
```

## Implementation Order (Milestones)

When implementing from scratch, follow this sequence from the spec:

1. **Foundation** — Next.js + TS strict + Tailwind + shadcn/ui + ESLint + Docker skeleton + `GET /api/health`
2. **Contracts & Engine** (highest priority) — Zod schemas → engine steps → Golden-Master tests → seed calibration profile "Standard 2026"
3. **Persistence** — Drizzle schema + migrations + seed + Better Auth + Server Actions
4. **UI** — Dashboard, estimation wizard with live preview (debounced Server Action), results dashboard with Recharts + transparent calculation breakdown
5. **External API & Export** — `/api/v1` Route Handlers + OpenAPI generation + PDF/XLSX export
6. **Admin & Benchmark skeleton** — profile/rate-card management UI, `benchmarks` table

## Key Domain Terms

| Term | Meaning |
|---|---|
| FP (Function Points) | Functional size metric |
| VAF (Value Adjustment Factor) | Non-functional complexity multiplier |
| PT (Personentage) | Person-days of effort |
| Kalibrierungsprofil | Versioned set of all engine coefficients |
| Snapshot | Frozen copy of input/result/versions stored on save |
| Golden-Master-Test | Test comparing output against a fixed reference fixture |
| Cost drivers (Kostentreiber) | The 8 input parameters that drive FP calculation |
