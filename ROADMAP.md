# Chronos Synapse – Roadmap

## Current state

- SDK ingestion (primary)
- Read-only dashboard (Next.js) with realtime updates
- Backend Fastify API with Redis Stack + Prisma
- Deployed targets: Fly.io (backend), Vercel (frontend)

## Near-term (v0.2)

- SDK
  - Stable `ChronosRunner` API (docs, examples)
  - Retry/backoff tuning, flush on process exit
  - Optional Socket.IO endpoint override
- Backend
  - Harden RediSearch/TimeSeries bootstrapping
  - User-scoped analytics and timeseries (done, iterate)
  - Job trigger scheduler improvements (timezone, jitter)
- Frontend
  - Analytics bucketing polish (7/30/90) and zero-fill (done)
  - Execution details UX (inline logs, code snippet) (done)
  - Profile UX (icons, readable dates) (done)

## Mid-term (v0.3)

- API keys: UI management, rotation, last used
- Job filters & search UX enhancements
- More execution telemetry: labels/metadata surfacing in UI
- Admin: rate-limit management UI

## SDK roadmap (v0.4+)

- Language helpers (Node first, explore Python)
- Local dev helpers: mock backend, offline queue
- CLI for generating deterministic job IDs and scaffolds

## Reliability

- Redis client keepalive/reconnect (done)
- Managed subscriber with ping/auto-reinit (done)
- Prisma migrate deploy on container start (done)

## Deployment

- Fly.io: rolling deploys, secrets configured
- Vercel: branch-based deploys (`dev-frontend`, `main`)
- GitHub Actions (future): SDK publish on tag `sdk-v*`

## Stretch

- AI insights re-introduction (local heuristics are in place)
- Multi-tenant orgs/apps management in UI
- Webhooks for ingestion events

_Last updated: Aug 2025_
