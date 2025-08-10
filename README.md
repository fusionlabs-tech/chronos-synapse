# Chronos Synapse

Telemetry-first job analytics: SDK ingestion + real-time, read‑only dashboard

## What it is now

- Backend: Fastify API that accepts job signatures and execution telemetry, stores in Redis Stack, and broadcasts realtime via Socket.IO. Auth with API keys.
- SDK: `chronos-synapse-sdk` to register jobs and send batched execution events. Primary API is `ChronosRunner`.
- Frontend: Next.js 14 dashboard (read-only) for jobs, executions, analytics, and profile.

## Core architecture

- Redis Stack
  - RedisJSON: jobs, executions
  - RediSearch: `idx:jobs`, `idx:executions` (TAG on `jobId`)
  - RedisTimeSeries: execution counters/durations (duplicate policy LAST)
  - Pub/Sub: `execution:ingested` → Socket.IO
- Postgres (Prisma): users and API keys
- Socket.IO: realtime to dashboard and SDK triggers

## SDK (apps instrument this)

Install (local):

```bash
npm install chronos-synapse-sdk
```

Use `ChronosRunner`:

```ts
import ChronosRunner from 'chronos-synapse-sdk';

const runner = new ChronosRunner({
 apiKey: process.env.CHRONOS_API_KEY!,
 // endpoint defaults to http://localhost:3001
 captureConsole: true,
});

await runner['client'].registerJobs([
 { id: 'job-1', name: 'Reports', schedule: '0 * * * *', runMode: 'recurring' },
 {
  id: 'job-once',
  name: 'One-time',
  schedule: '',
  runMode: 'once',
  runAt: '2025-09-01T12:00:00Z',
 },
]);

runner.register('job-1', async () => {
 /* work */
});
runner.register('job-once', async () => {
 /* one-time work */
});

runner.start();
```

Auto-captured telemetry: status, duration, error stack/message, stdout/stderr, code snippet/language, appVersion/jobVersion.

## Backend API (ingestion)

- POST `/api/ingest/jobs/register`

  - Body: `{ jobs: Array<{ id, name, schedule, runMode, version?, signatureHash?, orgId?, appId?, runAt? }> }`
  - Auth: `x-api-key`
  - Idempotent upsert; fills `userId`, `orgId`, `appId`; sets `runMode`.

- POST `/api/ingest/executions/batch`
  - Body: `{ executions: Array<ExecutionEvent> }`
  - Stores execution JSON, updates TS metrics, publishes `execution:ingested`.

## Frontend

- Read-only dashboard (Next.js 14): Jobs, Executions, Analytics, Profile
- Realtime Socket.IO integration (connection indicator, recent executions)
- User auth via OAuth/JWT; profile shows name, avatar, last login

## Deployment

- Backend (Fly.io)

  - Dockerfile builds TypeScript, generates Prisma client, runs `prisma migrate deploy` on start
  - Secrets to set:
    - `FRONTEND_URL` (e.g., https://your-frontend.vercel.app)
    - `DATABASE_URL` (Postgres, SSL enabled)
    - `REDIS_URL` (Redis Cloud/Stack URL)
    - `JWT_SECRET`
    - Optional: `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`
  - Deploy:
    - `flyctl deploy --remote-only`

- Frontend (Vercel)
  - Root: `frontend`
  - Build: `npm run build`, Output: `.next`
  - Env: `NEXT_PUBLIC_API_URL=https://<fly-app>.fly.dev/api`

## Local development

- Prereqs: Node 20+, Redis Stack, Postgres
- Setup:

```bash
# Backend
cp backend/.env.example backend/.env  # fill DATABASE_URL, REDIS_URL, JWT_SECRET
npm run build:backend && (cd backend && npx prisma migrate deploy)

# Frontend
cp frontend/.env.example frontend/.env
npm run dev  # runs apps in watch/dev (adjust scripts if needed)
```

## Notes & decisions

- Server-side job execution was removed. All execution happens in client apps (via SDK). The server ingests telemetry and triggers via Socket.IO for scheduled jobs.
- One-time jobs: use `runMode: 'once'` with either a cron (fires first match) or `runAt` (ISO/epoch).
- Realtime indexes: `idx:executions` uses TAG `jobId` (normalized id without dashes).

## License

MIT
