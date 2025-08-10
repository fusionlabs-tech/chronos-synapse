# @chronos-synapse/sdk

Chronos SDK Runner for registering jobs and running them on server triggers with rich telemetry (ingestion, metrics, realtime).

- Single API surface: ChronosRunner
- Buffered batching with periodic flush
- Exponential backoff with retries on 5xx/429
- TypeScript types included

## Installation

```bash
npm install @chronos-synapse/sdk
# or
yarn add @chronos-synapse/sdk
```

## Quick Start (Runner)

```ts
import ChronosRunner from '@chronos-synapse/sdk';

const runner = new ChronosRunner({
 apiKey: process.env.CHRONOS_API_KEY!,
 captureConsole: true,
});

// Register your job(s)
await runner['client'].registerJobs([
 // Recurring: requires a non-empty cron schedule
 {
  id: 'job:daily-report',
  name: 'Daily Report',
  schedule: '0 * * * *',
  runMode: 'recurring',
 },
 // One-time: can provide a cron (fires on first matching minute only), or leave schedule '' and provide runAt
 {
  id: 'job:migrate-once',
  name: 'One-time Migration',
  schedule: '*/2 * * * *',
  runMode: 'once',
 },
 // Alternatively one-time at a fixed time via runAt (ISO or epoch ms) with empty schedule
 {
  id: 'job:launch-once',
  name: 'Launch',
  schedule: '',
  runMode: 'once',
  runAt: '2025-09-01T12:00:00Z',
 },
]);

runner.register('job:daily-report', async () => {
 // Your work here
 await new Promise((r) => setTimeout(r, 150));
 if (Math.random() < 0.3) throw new Error('simulated failure');
});

runner.register('job:migrate-once', async () => {
 // Your work here
 await new Promise((r) => setTimeout(r, 150));
 if (Math.random() < 0.3) throw new Error('simulated failure');
});

runner.register('job:launch-once', async () => {
 // Your work here
 await new Promise((r) => setTimeout(r, 150));
 if (Math.random() < 0.3) throw new Error('simulated failure');
});

// Start listening for triggers
runner.start();
```

- `register(jobId, handler)`: registers a function to execute when the server emits a trigger for that job
- `start()`: connects to the server and begins listening for triggers
- `stop()`: disconnects

### Scheduling rules

- Recurring jobs: `runMode: 'recurring'` and a non-empty cron `schedule`.
- One-time jobs:
  - Option A: Provide a cron `schedule` and `runMode: 'once'` → the server triggers at the first matching minute only.
  - Option B: Provide `schedule: ''`, `runMode: 'once'`, and `runAt` (ISO string or epoch ms) → the server triggers once when `now >= runAt`.
- Changing `schedule` or `runMode` re-arms the one-time trigger if it hasn’t fired yet.

## What gets auto-captured

- status/exitCode, startedAt/finishedAt/duration
- Errors: errorMessage, errorStack (full), stderr (stack + captured stderr if enabled)
- Code context: codeSnippet (user-code frame), codeLanguage (from file extension)
- Versions: jobVersion (from registerJobs), appVersion (from package.json/env)
- stdout: console capture (when `captureConsole` is enabled)

The SDK truncates large fields by default (configurable via `maxLogBytes`).

## Privacy & Limits

- Truncation: `maxLogBytes` (default 10k) limits `stdout`, `stderr`, and `codeSnippet` sizes.
- Sensitive data: avoid logging secrets. You can preprocess/redact before throwing/printing.
- Roadmap: configurable redaction patterns in capture pipeline.

## Examples

- Local test app (Runner): `examples/sdk-local-test/runner.js`

## Local Testing (without publish)

- Build SDK: `npm run build:sdk`
- Install into local app:
  - `cd examples/sdk-local-test`
  - `npm install`
  - Set env: `export CHRONOS_API_URL=http://localhost:3001; export CHRONOS_API_KEY=...`
  - Run runner test: `npm run start:runner`

## Advanced (optional) – Low-level API

If you need direct control of telemetry, you can still enqueue events manually. You are responsible for `execId` generation and timing fields.

```ts
// Access the internal client via runner['client'] (advanced only)
runner['client'].enqueueExecution({
 execId: `job:daily-report:${Date.now()}`,
 jobId: 'job:daily-report',
 status: 'success',
 startedAt: new Date().toISOString(),
 finishedAt: new Date().toISOString(),
 durationMs: 742,
 exitCode: 0,
});
await runner['client'].flush();
```

## Telemetry Fields

| Field            | Source                          | Default/Example                    |
| ---------------- | ------------------------------- | ---------------------------------- |
| status           | handler outcome                 | `success` or `failed`              |
| exitCode         | handler outcome                 | 0 on success, 1 on failure         |
| startedAt        | runner                          | ISO string                         |
| finishedAt       | runner                          | ISO string                         |
| durationMs       | runner                          | `finishedAt - startedAt`           |
| errorMessage     | caught Error                    | `err.message`                      |
| errorType        | caught Error                    | `err.name`                         |
| errorStack       | caught Error                    | full stack                         |
| stderr           | runner                          | stack + captured stderr if enabled |
| stdout           | runner                          | captured console output (optional) |
| codeSnippet      | user-code frame from stack      | truncated to `maxLogBytes`         |
| codeLanguage     | inferred from file extension    | `javascript` if unknown            |
| jobVersion       | registerJobs cache              | defaults from package.json         |
| appVersion       | package.json or npm*package*... | undefined if not resolved          |
| labels, metadata | not used in Runner              | —                                  |
