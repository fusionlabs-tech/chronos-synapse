import { Server as SocketIOServer } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { redisService } from './RedisService';
import { logger } from '../utils/logger';

export interface PubSubMessage {
 type: string;
 data: Record<string, unknown>;
 timestamp: string;
}

export class PubSubService {
 private io: SocketIOServer | null = null;
 private redis: any;
 private isInitialized = false;
 private subscriber: any | null = null;
 private keepaliveInterval: NodeJS.Timeout | null = null;
 private schedulerInterval: NodeJS.Timeout | null = null;

 constructor() {
  this.redis = redisService.redis;
 }

 async initialize(fastify: FastifyInstance): Promise<void> {
  if (this.isInitialized) return;

  logger.info('Initializing Pub/Sub service...');

  this.io = new SocketIOServer(fastify.server, {
   cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
   },
   transports: ['websocket', 'polling'],
   allowEIO3: true,
   pingInterval: 25000,
   pingTimeout: 60000,
  });

  logger.info('Socket.IO server created');

  this.io.engine.on('connection_error', (err) => {
   logger.error('Socket.IO connection error:', err);
  });

  this.io.on('connection', (socket) => {
   logger.info(
    `WebSocket client connected: ${socket.id} from ${socket.handshake.address}`
   );

   socket.on('authenticate', (_token: string) => {
    socket.data.authenticated = true;
    socket.emit('authenticated', { success: true });
   });

   // Ignore client "ping" events used for keepalive
   socket.on('ping', () => {
    // no-op; engine.io handles low-level ping/pong
   });

   socket.on('disconnect', (reason) => {
    logger.info(
     `WebSocket client disconnected: ${socket.id}, reason: ${reason}`
    );
   });

   socket.on('error', (error) => {
    logger.error(`WebSocket client error: ${socket.id}`, error);
   });

   socket.on('join-job', (jobId: string) => {
    const id = String(jobId || '').replace(/^job:/, '');
    socket.join(`job:${id}`);
    logger.info(`Client ${socket.id} joined job room: ${jobId}`);
   });

   socket.on('leave-job', (jobId: string) => {
    const id = String(jobId || '').replace(/^job:/, '');
    socket.leave(`job:${id}`);
    logger.info(`Client ${socket.id} left job room: ${jobId}`);
   });
  });

  await this.setupSubscriber();
  await this.startScheduler();

  this.isInitialized = true;
  logger.info('PubSub service initialized with Socket.IO and Redis');
 }

 private parseMinuteCron(schedule: string): { every: number } | null {
  // Accept "* * * * *" (every minute) or "*/n * * * *"
  const parts = (schedule || '').trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const minute = parts[0];
  if (minute === '*') return { every: 1 };
  const m = minute.match(/^\*\/(\d{1,2})$/);
  if (m) {
   const n = parseInt(m[1], 10);
   if (n > 0 && n <= 60) return { every: n };
  }
  return null;
 }

 private async startScheduler(): Promise<void> {
  if (this.schedulerInterval) clearInterval(this.schedulerInterval);
  // Check every 30 seconds
  this.schedulerInterval = setInterval(async () => {
   try {
    const now = new Date();
    const currentMinuteKey = `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1)
     .toString()
     .padStart(2, '0')}-${now.getUTCDate().toString().padStart(2, '0')}T${now
     .getUTCHours()
     .toString()
     .padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`; // minute resolution UTC
    // Fetch enabled jobs
    const jobs = await redisService.searchJobs('*', { enabled: true });
    for (const job of jobs as any[]) {
     const jobId = String(job.id).replace(/^job:/, '');
     const isOnce =
      String(job.runMode || '').toLowerCase() === 'once' ||
      !job.schedule ||
      String(job.schedule).trim() === '';
     const onceKey = `trigger:once:${jobId}`;
     if (isOnce) {
      // If runAt is provided, fire once when now >= runAt and not yet done
      const runAtIso = (job as any).runAt
       ? String((job as any).runAt)
       : undefined;
      if (runAtIso) {
       const runAt = new Date(runAtIso);
       if (!Number.isNaN(runAt.getTime())) {
        const done = await this.redis.get(onceKey);
        const withinWindow =
         now.getTime() >= runAt.getTime() &&
         now.getTime() - runAt.getTime() < 60_000; // 1 minute window
        if (!done && withinWindow) {
         const triggerId = `${jobId}:${Date.now()}`;
         const payload = {
          jobId,
          triggerId,
          scheduledFor: runAt.toISOString(),
         };
         this.broadcastToJob(jobId, 'job:trigger', payload);
         await this.redis.set(onceKey, '1', { PX: 7 * 24 * 3600_000 });
         logger.info(
          `Emitted one-time job:trigger for job ${jobId} at runAt ${runAt.toISOString()}`
         );
         continue;
        }
       }
      }
      // Otherwise, if a schedule exists, allow first matching cron only once
      const sched = String(job.schedule || '').trim();
      const cron = this.parseMinuteCron(sched);
      if (!cron && !runAtIso) {
       // No schedule, no runAt: nothing to do (won't auto-trigger)
       continue;
      }
      const done = await this.redis.get(onceKey);
      if (done) continue;
      if (cron) {
       const every = cron.every;
       const minute = now.getUTCMinutes();
       if (every === 1 || (every !== 1 && minute % every === 0)) {
        const triggerId = `${jobId}:${Date.now()}`;
        const payload = { jobId, triggerId, scheduledFor: now.toISOString() };
        this.broadcastToJob(jobId, 'job:trigger', payload);
        await this.redis.set(onceKey, '1', { PX: 7 * 24 * 3600_000 });
        logger.info(
         `Emitted first-match one-time job:trigger for job ${jobId} (${sched})`
        );
       }
      }
      continue;
     }
     const sched = String(job.schedule || '').trim();
     const cron = this.parseMinuteCron(sched);
     if (!cron) continue;
     const every = cron.every;
     const minute = now.getUTCMinutes();
     if (every !== 1 && minute % every !== 0) continue;
     const lastKey = `trigger:last:${jobId}`;
     const last = await this.redis.get(lastKey);
     if (last === currentMinuteKey) continue; // already triggered this minute window
     // Emit trigger
     const triggerId = `${jobId}:${Date.now()}`;
     const payload = { jobId, triggerId, scheduledFor: now.toISOString() };
     // Emit to job room
     this.broadcastToJob(jobId, 'job:trigger', payload);
     // Store last trigger marker
     await this.redis.set(lastKey, currentMinuteKey, { PX: 3600_000 }); // expire after an hour
     logger.info(`Emitted job:trigger for job ${jobId} (${sched})`);
    }
   } catch (err) {
    logger.error('Scheduler tick failed:', err);
   }
  }, 30000);
 }

 private async setupSubscriber(): Promise<void> {
  if (this.subscriber) {
   try {
    await this.subscriber.quit();
   } catch {}
   this.subscriber = null;
  }

  const subscriber = this.redis.duplicate();
  await subscriber.connect();

  subscriber.on('error', (err: any) => {
   logger.error('Redis subscriber error:', err);
  });
  subscriber.on('end', () => {
   logger.warn('Redis subscriber connection ended');
  });

  // Ingestion-driven execution events
  await subscriber.subscribe('execution:ingested', (message: string) => {
   try {
    const parsedMessage = JSON.parse(message);
    // Broadcast globally and to job room
    this.broadcastToAll('execution:ingested', parsedMessage);
    if (parsedMessage?.jobId) {
     this.broadcastToJob(
      parsedMessage.jobId,
      'execution:ingested',
      parsedMessage
     );
    }
   } catch (error) {
    logger.error('Failed to parse execution:ingested message:', error);
   }
  });

  // Notifications (e.g., AI analysis alerts)
  await subscriber.subscribe('notifications', (message: string) => {
   try {
    const parsedMessage = JSON.parse(message);
    this.broadcastToAll('notifications', parsedMessage);
   } catch (error) {
    logger.error('Failed to parse notification message:', error);
   }
  });

  // Keepalive PING on subscriber connection to keep TCP active
  if (this.keepaliveInterval) clearInterval(this.keepaliveInterval);
  this.keepaliveInterval = setInterval(async () => {
   try {
    await subscriber.ping();
   } catch (err) {
    logger.warn('Redis subscriber ping failed, reinitializing subscriber');
    clearInterval(this.keepaliveInterval!);
    this.keepaliveInterval = null;
    try {
     await this.setupSubscriber();
    } catch (e) {
     logger.error('Failed to reinitialize Redis subscriber:', e);
    }
   }
  }, 20000);

  this.subscriber = subscriber;

  logger.info(
   'Subscribed to Redis channels: execution:ingested, notifications'
  );
 }

 async publish(channel: string, message: PubSubMessage): Promise<void> {
  try {
   await this.redis.publish(channel, JSON.stringify(message));
   logger.debug(`Published to Redis channel ${channel}:`, message.type);
  } catch (error) {
   logger.error(`Failed to publish to Redis channel ${channel}:`, error);
  }
 }

 private broadcastToAll(event: string, data: any): void {
  if (!this.io) {
   logger.warn('Socket.IO not initialized, cannot broadcast');
   return;
  }
  this.io.emit(event, data);
 }

 private broadcastToJob(jobId: string, event: string, data: any): void {
  if (!this.io) {
   logger.warn('Socket.IO not initialized, cannot broadcast to job');
   return;
  }
  const id = String(jobId || '').replace(/^job:/, '');
  this.io.to(`job:${id}`).emit(event, data);
 }

 getConnectionStats(): { total: number; authenticated: number } {
  if (!this.io) {
   return { total: 0, authenticated: 0 };
  }
  let authenticated = 0;
  this.io.sockets.sockets.forEach((socket) => {
   if (socket.data.authenticated) authenticated++;
  });
  return { total: this.io.sockets.sockets.size, authenticated };
 }

 async shutdown(): Promise<void> {
  if (this.keepaliveInterval) {
   clearInterval(this.keepaliveInterval);
   this.keepaliveInterval = null;
  }
  if (this.schedulerInterval) {
   clearInterval(this.schedulerInterval);
   this.schedulerInterval = null;
  }
  if (this.subscriber) {
   try {
    await this.subscriber.quit();
   } catch {}
   this.subscriber = null;
  }
  if (this.io) {
   this.io.close();
   logger.info('PubSub service shutdown complete');
  }
 }
}

export const pubSubService = new PubSubService();
