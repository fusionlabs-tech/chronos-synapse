import fs from 'node:fs';
import path from 'node:path';
import { io, Socket } from 'socket.io-client';
const DEFAULT_ENDPOINT = 'http://localhost:3001';
export type ChronosSDKConfig = {
 endpoint?: string;
 apiKey: string;
 orgId?: string;
 appId?: string;
 batchSize?: number;
 flushIntervalMs?: number;
 // Optional telemetry capture toggles
 captureConsole?: boolean; // capture process stdout/stderr during wrap()
 maxLogBytes?: number; // truncate captured logs/snippets
};

export type JobSignature = {
 id: string; // deterministic id recommended
 name: string;
 schedule: string; // cron string; for one-time jobs, still provide a cron (first match will fire once), or provide '' with runAt
 runMode: 'once' | 'recurring';
 version?: string;
 signatureHash?: string;
 orgId?: string;
 appId?: string;
 runAt?: string | number; // optional ISO string or epoch ms for one-time jobs
};

export type ExecutionEvent = {
 execId: string;
 jobId: string;
 status: 'success' | 'failed';
 startedAt: string;
 finishedAt: string;
 durationMs: number;
 exitCode?: number;
 errorMessage?: string;
 // Optional richer telemetry
 errorType?: string;
 errorStack?: string;
 stdout?: string; // consider truncation client-side
 stderr?: string; // consider truncation client-side
 attempt?: number;
 labels?: string[];
 metadata?: Record<string, unknown>;
 jobVersion?: string;
 appVersion?: string;
 // Optional code context for AI analysis
 codeSnippet?: string;
 codeLanguage?: string;
};

class ChronosClient {
 private config: Required<Pick<ChronosSDKConfig, 'endpoint' | 'apiKey'>> &
  Omit<ChronosSDKConfig, 'endpoint' | 'apiKey'>;
 private queue: ExecutionEvent[] = [];
 private timer: NodeJS.Timeout | null = null;
 private isFlushing = false;
 private jobVersionById: Record<string, string> = {};
 private cachedAppVersion?: string;

 constructor(config: ChronosSDKConfig) {
  const resolvedEndpoint =
   config.endpoint ||
   process.env.CHRONOS_API_URL ||
   process.env.CHRONOS_ENDPOINT ||
   DEFAULT_ENDPOINT;
  if (!resolvedEndpoint || !config.apiKey) {
   throw new Error('ChronosClient requires endpoint and apiKey');
  }
  this.config = {
   endpoint: resolvedEndpoint.replace(/\/$/, ''),
   apiKey: config.apiKey,
   orgId: config.orgId || process.env.CHRONOS_ORG_ID,
   appId: config.appId || process.env.CHRONOS_APP_ID,
   batchSize: config.batchSize ?? 50,
   flushIntervalMs: config.flushIntervalMs ?? 2000,
   captureConsole: config.captureConsole ?? false,
   maxLogBytes: config.maxLogBytes ?? 10000,
  };
 }

 private detectAppVersion(): string | undefined {
  if (this.cachedAppVersion) return this.cachedAppVersion;
  // Prefer env when running under npm scripts
  const envVer = process.env.npm_package_version;
  if (envVer) {
   this.cachedAppVersion = envVer;
   return envVer;
  }
  try {
   // Try to read nearest package.json
   const pkgPath = path.join(process.cwd(), 'package.json');
   const json = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
    version?: string;
   };
   if (json?.version) {
    this.cachedAppVersion = String(json.version);
    return this.cachedAppVersion;
   }
  } catch {}
  return undefined;
 }

 // Note: language/snippet helpers exist only in ChronosRunner where they are used

 async registerJobs(jobs: JobSignature[]): Promise<void> {
  // Basic validation: require schedule and runMode
  for (const j of jobs) {
   if (!j || typeof j !== 'object')
    throw new Error('registerJobs: invalid job entry');
   if (!j.id || !j.name)
    throw new Error('registerJobs: job id and name are required');
   if (
    typeof j.runMode !== 'string' ||
    !['once', 'recurring'].includes(j.runMode)
   ) {
    throw new Error(
     `registerJobs: job ${j.id} requires runMode ('once' | 'recurring')`
    );
   }
   if (typeof j.schedule !== 'string') {
    throw new Error(
     `registerJobs: job ${j.id} requires schedule string (cron or '')`
    );
   }
   if (j.runMode === 'recurring' && j.schedule.trim() === '') {
    throw new Error(
     `registerJobs: job ${j.id} recurring requires a non-empty cron schedule`
    );
   }
  }
  const payload = {
   jobs: jobs.map((j) => ({
    ...j,
    orgId: j.orgId ?? this.config.orgId,
    appId: j.appId ?? this.config.appId,
    version: j.version ?? this.detectAppVersion(),
   })),
  };
  await this.post('/api/ingest/jobs/register', payload);
  // Cache job versions for auto-fill during telemetry
  for (const j of jobs) {
   const v = j?.version ?? this.detectAppVersion();
   if (j?.id && v) this.jobVersionById[j.id] = v;
  }
 }

 enqueueExecution(event: ExecutionEvent): void {
  const filled: ExecutionEvent = {
   ...event,
   codeLanguage: event.codeLanguage ?? 'javascript',
   appVersion: event.appVersion ?? this.detectAppVersion(),
   jobVersion:
    event.jobVersion ?? (this.jobVersionById[event.jobId] || event.jobVersion),
  };
  this.queue.push(filled);
  if (!this.timer) this.startTimer();
  if (this.queue.length >= (this.config.batchSize ?? 50)) {
   void this.flush();
  }
 }

 async flush(): Promise<void> {
  if (this.isFlushing || this.queue.length === 0) return;
  this.isFlushing = true;
  try {
   const batch = this.queue.splice(0, this.config.batchSize ?? 50);
   await this.post('/api/ingest/executions/batch', { executions: batch });
  } finally {
   this.isFlushing = false;
   if (this.queue.length === 0 && this.timer) this.stopTimer();
  }
 }

 // wrap() and express() have been removed from the public API. Use ChronosRunner for scheduled/triggered execution.

 private startTimer() {
  if (this.timer) return;
  this.timer = setInterval(() => {
   if (this.queue.length > 0) void this.flush();
  }, this.config.flushIntervalMs ?? 2000);
 }

 private stopTimer() {
  if (this.timer) {
   clearInterval(this.timer);
   this.timer = null;
  }
 }

 private async post(path: string, body: any, attempt = 1): Promise<void> {
  const url = `${this.config.endpoint}${path}`;
  const res = await fetch(url, {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
    'x-api-key': this.config.apiKey,
   },
   body: JSON.stringify(body),
  });
  if (!res.ok) {
   if (attempt < 5 && (res.status >= 500 || res.status === 429)) {
    const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
    await new Promise((r) => setTimeout(r, backoff));
    return this.post(path, body, attempt + 1);
   }
   const text = await res.text().catch(() => '');
   throw new Error(`Chronos post failed: ${res.status} ${text}`);
  }
 }
}

export class ChronosRunner {
 private client: ChronosClient;
 private socket: Socket | null = null;
 private handlers: Map<string, () => Promise<unknown>> = new Map();
 private connected = false;
 private pickUserStackFrame(stack: string): {
  filePath?: string;
  lineNum?: number;
 } {
  try {
   const lines = String(stack || '').split(/\n+/);
   const candidates: Array<{
    filePath: string;
    lineNum: number;
    score: number;
   }> = [];
   const rx = /(?:at\s+.*\()?((?:file:\/\/)?[^\s)]+):(\d+):(\d+)\)?/;
   for (const line of lines) {
    const m = line.match(rx);
    if (!m) continue;
    let p = m[1];
    const ln = Number(m[2]);
    if (!Number.isFinite(ln)) continue;
    if (p.startsWith('file://')) {
     try {
      p = new URL(p).pathname;
     } catch {}
    }
    const pathLower = p.toLowerCase();
    let score = 100;
    if (pathLower.includes('node_modules')) score -= 50;
    if (
     pathLower.includes('/@chronos-synapse/sdk/dist') ||
     pathLower.endsWith('/sdk/dist/index.js')
    )
     score -= 40;
    candidates.push({ filePath: p, lineNum: ln, score });
   }
   if (candidates.length === 0) return {};
   candidates.sort((a, b) => b.score - a.score);
   return { filePath: candidates[0].filePath, lineNum: candidates[0].lineNum };
  } catch {
   return {};
  }
 }

 constructor(config: ChronosSDKConfig) {
  this.client = new ChronosClient(config);
 }

 private truncate(input?: string): string | undefined {
  if (typeof input !== 'string') return input;
  const limit = ((this.client as any).config?.maxLogBytes as number) ?? 10000;
  return input.length > limit ? input.slice(0, limit) : input;
 }

 private guessLanguageFromPath(filePath?: string): string | undefined {
  if (!filePath) return undefined;
  const ext = filePath.toLowerCase().split('.').pop();
  if (!ext) return undefined;
  if (ext === 'ts' || ext === 'tsx') return 'typescript';
  if (['js', 'jsx', 'mjs', 'cjs'].includes(ext)) return 'javascript';
  if (ext === 'py') return 'python';
  if (ext === 'sh' || ext === 'bash') return 'bash';
  return undefined;
 }

 private extractSnippetFromError(err: any): {
  snippet?: string;
  file?: string;
 } {
  try {
   const stack: string = String(err?.stack || '');
   const picked = this.pickUserStackFrame(stack);
   if (!picked?.filePath || !picked?.lineNum)
    return { snippet: undefined, file: undefined };
   let filePath = picked.filePath;
   const lineNum = picked.lineNum;
   if (!filePath || !Number.isFinite(lineNum))
    return { snippet: undefined, file: undefined };
   if (filePath.startsWith('file://')) {
    try {
     filePath = new URL(filePath).pathname;
    } catch {}
   }
   const fsContent = fs.readFileSync(filePath, 'utf8');
   const lines = fsContent.split(/\r?\n/);
   const before = 40,
    after = 80;
   const start = Math.max(0, lineNum - before);
   const end = Math.min(lines.length, lineNum + after);
   const selected = lines.slice(start, end).join('\n');
   return { snippet: this.truncate(selected), file: filePath };
  } catch {
   return { snippet: undefined, file: undefined };
  }
 }

 register(jobId: string, handler: () => Promise<unknown>): void {
  this.handlers.set(jobId, handler);
  if (this.connected) {
   try {
    this.socket?.emit('join-job', jobId);
   } catch {}
  }
 }

 start(): void {
  if (this.socket) return;
  const endpoint = (this.client as any).config.endpoint as string;
  const url = endpoint.replace(/\/$/, '').replace(/\/$/, '');
  this.socket = io(url, {
   transports: ['websocket'],
   extraHeaders: {
    'x-api-key': (this.client as any).config.apiKey,
   },
   autoConnect: true,
  });
  this.socket.on('connect', () => {
   this.connected = true;
   // Join all registered job rooms
   for (const jobId of this.handlers.keys()) {
    try {
     this.socket?.emit('join-job', jobId);
    } catch {}
   }
  });
  this.socket.on('disconnect', () => {
   this.connected = false;
  });
  this.socket.on('connect_error', (err: any) => {
   // eslint-disable-next-line no-console
   console.error('ChronosRunner socket connect error:', err?.message || err);
  });
  this.socket.on('job:trigger', async (payload: any) => {
   try {
    const jobId = String(payload?.jobId || '');
    const handler = this.handlers.get(jobId);
    if (!handler) return;
    const startedAt = new Date();
    const execId = `${jobId}:${startedAt.getTime()}`;
    const captureConsole = Boolean((this.client as any).config?.captureConsole);
    let capturedOut = '';
    let capturedErr = '';
    const origStdout = process.stdout.write as any;
    const origStderr = process.stderr.write as any;
    if (captureConsole) {
     try {
      (process.stdout.write as any) = (chunk: any, ...args: any[]) => {
       try {
        capturedOut += typeof chunk === 'string' ? chunk : String(chunk);
       } catch {}
       return origStdout.call(process.stdout, chunk, ...args);
      };
      (process.stderr.write as any) = (chunk: any, ...args: any[]) => {
       try {
        capturedErr += typeof chunk === 'string' ? chunk : String(chunk);
       } catch {}
       return origStderr.call(process.stderr, chunk, ...args);
      };
     } catch {}
    }
    try {
     await handler();
     const finishedAt = new Date();
     this.client.enqueueExecution({
      execId,
      jobId,
      status: 'success',
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      exitCode: 0,
      stdout: this.truncate(capturedOut || undefined),
     });
    } catch (err: any) {
     const finishedAt = new Date();
     const fromStack = this.extractSnippetFromError(err);
     const codeLanguage =
      this.guessLanguageFromPath(fromStack.file) || 'javascript';
     const stderrFull = this.truncate(
      (capturedErr ? capturedErr + '\n\n' : '') +
       (typeof err?.stack === 'string'
        ? err.stack
        : String(err?.message || err))
     );
     this.client.enqueueExecution({
      execId,
      jobId,
      status: 'failed',
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      exitCode: 1,
      errorMessage: String(err?.message || err),
      errorType: err?.name,
      errorStack: typeof err?.stack === 'string' ? err.stack : undefined,
      stderr: stderrFull,
      codeSnippet: fromStack.snippet,
      codeLanguage,
     });
    } finally {
     if (captureConsole) {
      try {
       (process.stdout.write as any) = origStdout;
       (process.stderr.write as any) = origStderr;
      } catch {}
     }
    }
    // Acknowledge (best-effort)
    try {
     this.socket?.emit('trigger:ack', { triggerId: payload?.triggerId, jobId });
    } catch {}
   } catch {}
  });
 }

 stop(): void {
  if (this.socket) {
   try {
    this.socket.disconnect();
   } catch {}
   this.socket = null;
  }
  this.connected = false;
 }
}

export default ChronosRunner;
