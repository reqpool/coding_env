# AGENTS.md

Conventions for AI-assisted development on this project.

## Hard constraints

**Engine stays I/O-free.**
`src/lib/engine/` must never import from `next`, `drizzle`, `better-auth`, or any I/O library.
`computeEstimation(input, profile)` is a pure function: same inputs → bit-identical output, always.
No `Date.now()`, `Math.random()`, or locale-dependent operations inside the engine.

**Contracts are the single source of truth.**
All data shapes live as Zod schemas in `src/lib/contracts/`.
Types are always derived via `z.infer<typeof Schema>` — never write duplicate interfaces.
Engine, Server Actions, Route Handlers, and form validation all import from contracts.

**Engine changes require Golden-Master fixture updates.**
Any change to a formula in `src/lib/engine/steps/` must be accompanied by a deliberate update to the test fixtures in `src/lib/engine/__tests__/`.
The test exists to make formula changes a conscious, visible decision — not to catch accidents silently.

**Snapshot principle.**
When an estimation is saved to the DB, `input`, `result`, `engine_version`, and `profile_version` are frozen as JSONB.
Never mutate a saved estimation's result — create a new one instead.

## Naming conventions

| Concern | Convention |
|---|---|
| Zod schemas | `PascalCaseSchema` (e.g., `EstimationInputSchema`) |
| Inferred types | `PascalCase` from `z.infer` (e.g., `EstimationInput`) |
| Server Actions | camelCase verbs in `src/app/actions/` (e.g., `saveEstimation`) |
| Route Handlers | `route.ts` in `/api/v1/<resource>/` |
| Engine steps | lowercase noun in `src/lib/engine/steps/` (e.g., `fp.ts`, `vaf.ts`, `effort.ts`) |
| DB tables | snake_case (e.g., `calibration_profiles`) |

## No tRPC

Internal consumers → Server Actions. External consumers → `/api/v1` Route Handlers.
Do not introduce tRPC unless explicitly decided.
