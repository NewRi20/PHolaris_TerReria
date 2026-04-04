# Concerns

## Security and Secrets Hygiene
- A local environment file appears present in repo path (`backend/.env`); ensure it is gitignored and never committed.
- Integration keys are consumed directly from env and external providers; enforce secret scanning in CI before merges.
- JWT setup relies on a single shared secret and symmetric algorithm; verify rotation and non-default values per environment.

## Observability Gaps
- Several background and integration paths catch broad exceptions and continue silently (for example in `backend/app/main.py`, AI/email pathways).
- Logging/metrics instrumentation is not obvious from sampled code; failures could be hard to diagnose in production.

## In-Memory State Risks
- Analytics cache and AI recommendation cache are in-memory process globals (`analytics_cache.py`, `routers/ai.py`).
- Multi-instance deployments can yield inconsistent behavior across replicas.
- Process restarts drop cache/recommendation state, impacting admin workflow predictability.

## Transaction and Consistency Risks
- Mix of implicit commit in dependency and explicit commits in routes/services can complicate transaction mental model.
- Email invitation send loop logs per-recipient outcomes but continues on broad exceptions without surfaced diagnostics.

## Domain/Data Integrity Risks
- Event and targeting fields allow flexible JSON payloads; schema normalization rules need strong validation to avoid malformed criteria.
- AI-generated event payload parsing depends on model response shape and heuristic code-block stripping.
- Sentiment scoring is model-driven and may need guardrails/auditability for policy-sensitive usage.

## Frontend Delivery Risk
- Frontend appears mostly scaffold-level (`frontend/src/App.tsx` shows placeholder UI).
- Backend has advanced domain capabilities, so product experience risk is currently on client implementation completeness.

## Testing Gaps
- Backend tests are mostly unit-style with fake sessions, which may miss real DB/query behavior regressions.
- No frontend test suite observed.
- Limited evidence of end-to-end verification from login to teacher/admin workflows.

## Performance and Scale Considerations
- Teacher targeting and invite flow may iterate large recipient sets in-process without batching/queueing.
- Analytics computations and AI calls are synchronous within request lifecycle for some endpoints; can increase response latency.

## Immediate Mitigations
- Add structured logging around broad exception blocks.
- Add lightweight integration tests for critical database-backed flows.
- Define production-safe strategy for cache/recommendation state (Redis or persisted table).
- Add CI secret scanning and repository-level guardrails.
