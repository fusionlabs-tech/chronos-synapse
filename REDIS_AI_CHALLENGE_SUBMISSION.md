_This is a submission for the [Redis AI Challenge](https://dev.to/challenges/redis-2025-07-23): Beyond the Cache_.

## What I Built

Chronos Synapse is a telemetry-first job analytics platform that turns your scheduled/triggered code into real-time operational insight — without running code on the server.

- SDK-first ingestion: a lightweight Node SDK (`chronos-synapse-sdk`) that registers jobs and streams execution telemetry (status, duration, errors, stdout/stderr, code snippet/language, versions).
- Backend ingestion service: Fastify API that stores job definitions and execution events in Redis Stack and emits real-time updates via Socket.IO.
- Read-only dashboard: a Next.js 14 app for visualizing jobs, executions, and analytics with live updates and user-scoped stats.

Why this approach? Many teams already run jobs in their own apps. Chronos keeps the execution where it belongs and specializes in visibility, metrics, and real-time insights.

Key capabilities:

- Deterministic job IDs and schedules (cron or one-time `runAt`) with server-driven `job:trigger` events for recurring jobs.
- Rich telemetry capture out of the box (error stack, stdout/stderr, snippet+language, app and job versions) with batching, backoff, and retries.
- Real-time dashboard updates powered by Redis Pub/Sub → Socket.IO.

## Demo

- Live Dashboard (read-only): `https://<your-vercel-domain>`
- Public API (ingestion not open; demo endpoints): `https://chronos-synapse-backend.fly.dev/api/health`
- SDK package: `https://www.npmjs.com/package/chronos-synapse-sdk`

Screenshots (replace with your links):

- Jobs list with “Last run” indicators
- Execution details with inline logs & code snippet
- Analytics with success/failed stacked bars + total executions line

Quick SDK example:

```ts
import ChronosRunner from 'chronos-synapse-sdk';

const runner = new ChronosRunner({
 apiKey: process.env.CHRONOS_API_KEY!,
 // endpoint defaults to http://localhost:3001
 captureConsole: true,
});

await runner['client'].registerJobs([
 {
  id: 'job:daily-report',
  name: 'Daily Report',
  schedule: '0 * * * *',
  runMode: 'recurring',
 },
 {
  id: 'job:launch-once',
  name: 'One-time Launch',
  schedule: '',
  runMode: 'once',
  runAt: '2025-09-01T12:00:00Z',
 },
]);

runner.register('job:daily-report', async () => {
 // your work
});
runner.register('job:launch-once', async () => {
 // runs once based on runAt or first cron match
});

runner.start();
```

## How I Used Redis 8

Chronos Synapse leans on Redis Stack as the system of record and real-time transport — far beyond caching. We combine multiple modules/features:

- RedisJSON (primary store)

  - Jobs and executions are stored as JSON documents. Execution JSON includes rich telemetry fields (stdout/stderr, errorType/stack, code snippet/language, versions, labels/metadata).

- RediSearch (fast querying & analytics)

  - Two indices: `idx:jobs` and `idx:executions`.
  - Executions index uses a TAG field for `jobId` (normalized, hyphens removed) so we can query with `@jobId:{id1|id2|...}` per user scope.
  - We sort/filter by `startedAt` and aggregate client-side for charts and daily/weekly/monthly bucketing.

- RedisTimeSeries (metrics and trends)

  - Time series keys for counters and duration distributions: `ts:jobs:executions`, `ts:jobs:success`, `ts:jobs:failed`, `ts:jobs:duration_ms`.
  - Writes use `TS.INCRBY` (counters) and `TS.ADD ... ON_DUPLICATE LAST` (durations) with `DUPLICATE_POLICY=LAST` to avoid collisions.
  - This enables a fast, low-overhead trend API for the analytics page.

- Pub/Sub (realtime fan-out)

  - Ingestion publishes a lightweight `execution:ingested` event.
  - A managed Redis subscriber relays events to Socket.IO (with keepalive `PING` every 20s, auto-reinit on failure).
  - Dashboard receives instant updates for “Recent Executions” and stats.

- Operational hardening (Redis client)
  - `connectTimeout`, `keepAlive`, `noDelay`, and a reconnect strategy that avoids 0ms delay on first retry.
  - Regular PING health checks, and defer to re-init subscriber on ping failure.

Patterns beyond cache:

- RedisJSON + RediSearch = document DB + search for job/execution browsing & scoped analytics.
- RedisTimeSeries = metrics store suitable for charts and time-windowed KPIs.
- Pub/Sub = real-time event bus for dashboard/SDK triggers.

### Data model & queries (sketch)

- Job JSON (id, name, schedule, runMode, userId, org/app, tags, timestamps)
- Execution JSON (id, jobId TAG, status, started/finished, duration, exitCode, stdout, stderr, snippet/language, versions)
- Search examples:
  - `FT.SEARCH idx:executions "@jobId:{<id>|<id2>}" SORTBY startedAt DESC LIMIT 0 1000`
  - User-scoped analytics derived by intersecting a user’s job IDs and time window.

### Scheduling & triggers

- A small server-side scheduler scans enabled jobs every 30s, parses minute-level cron, and emits `job:trigger` events (per minute de-dupe via a Redis key). For one-time jobs, we either respect `runAt` (single fire) or fire on the first cron match.

---

- Team: Solo submission (credit: @DesmondSanctity)
- Cover image: add a dashboard screenshot/banner of your choice

Thanks for reading and for organizing the challenge!

<!--  ⚠️ By submitting this entry, you agree to receive communications from Redis regarding products, services, events, and special offers. You can unsubscribe at any time. Your information will be handled in accordance with Redis's Privacy Policy. -->
