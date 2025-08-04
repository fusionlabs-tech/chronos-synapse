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

 constructor() {
  this.redis = redisService.redis;
 }

 async initialize(fastify: FastifyInstance): Promise<void> {
  if (this.isInitialized) return;

  logger.info('Initializing Pub/Sub service...');

  // Create Socket.IO server
  this.io = new SocketIOServer(fastify.server, {
   cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
   },
   transports: ['websocket', 'polling'],
   allowEIO3: true,
  });

  logger.info('Socket.IO server created');

  // Handle server-level events
  this.io.engine.on('connection_error', (err) => {
   logger.error('Socket.IO connection error:', err);
  });

  // Handle Socket.IO connections
  this.io.on('connection', (socket) => {
   logger.info(
    `WebSocket client connected: ${socket.id} from ${socket.handshake.address}`
   );

   // Handle authentication
   socket.on('authenticate', (token: string) => {
    logger.info(`Client ${socket.id} attempting authentication`);
    // TODO: Verify JWT token here
    socket.data.authenticated = true;
    socket.emit('authenticated', { success: true });
    logger.info(`Client ${socket.id} authenticated successfully`);
   });

   // Handle client disconnect
   socket.on('disconnect', (reason) => {
    logger.info(
     `WebSocket client disconnected: ${socket.id}, reason: ${reason}`
    );
   });

   // Handle connection errors
   socket.on('error', (error) => {
    logger.error(`WebSocket client error: ${socket.id}`, error);
   });

   // Handle room joins for specific job monitoring
   socket.on('join-job', (jobId: string) => {
    socket.join(`job:${jobId}`);
    logger.info(`Client ${socket.id} joined job room: ${jobId}`);
   });

   socket.on('leave-job', (jobId: string) => {
    socket.leave(`job:${jobId}`);
    logger.info(`Client ${socket.id} left job room: ${jobId}`);
   });
  });

  // Subscribe to Redis channels
  await this.subscribeToChannels();

  this.isInitialized = true;
  logger.info('PubSub service initialized with Socket.IO and Redis');
 }

 private async subscribeToChannels(): Promise<void> {
  const subscriber = this.redis.duplicate();
  await subscriber.connect();

  // Subscribe to job events
  await subscriber.subscribe('job_events', (message: string) => {
   try {
    const parsedMessage = JSON.parse(message);
    this.broadcastToAll('job_events', parsedMessage);
   } catch (error) {
    logger.error('Failed to parse job event message:', error);
   }
  });

  // Subscribe to job execution events
  await subscriber.subscribe('job_execution', (message: string) => {
   try {
    const parsedMessage = JSON.parse(message);
    this.broadcastToAll('job_execution', parsedMessage);
   } catch (error) {
    logger.error('Failed to parse job execution message:', error);
   }
  });

  // Subscribe to system metrics
  await subscriber.subscribe('system_metrics', (message: string) => {
   try {
    const parsedMessage = JSON.parse(message);
    this.broadcastToAll('system_metrics', parsedMessage);
   } catch (error) {
    logger.error('Failed to parse system metrics message:', error);
   }
  });

  // Subscribe to notifications
  await subscriber.subscribe('notifications', (message: string) => {
   try {
    const parsedMessage = JSON.parse(message);
    this.broadcastToAll('notifications', parsedMessage);
   } catch (error) {
    logger.error('Failed to parse notification message:', error);
   }
  });

  logger.info('Subscribed to Redis channels for Pub/Sub');
 }

 // Publish to Redis channel
 async publish(channel: string, message: PubSubMessage): Promise<void> {
  try {
   await this.redis.publish(channel, JSON.stringify(message));
   logger.debug(`Published to Redis channel ${channel}:`, message.type);
  } catch (error) {
   logger.error(`Failed to publish to Redis channel ${channel}:`, error);
  }
 }

 // Broadcast to all connected WebSocket clients
 private broadcastToAll(event: string, data: any): void {
  if (!this.io) {
   logger.warn('Socket.IO not initialized, cannot broadcast');
   return;
  }

  this.io.emit(event, data);
  logger.debug(`Broadcasted ${event} to all clients`);
 }

 // Broadcast to specific job room
 broadcastToJob(jobId: string, event: string, data: any): void {
  if (!this.io) {
   logger.warn('Socket.IO not initialized, cannot broadcast to job');
   return;
  }

  this.io.to(`job:${jobId}`).emit(event, data);
  logger.debug(`Broadcasted ${event} to job room: ${jobId}`);
 }

 // Broadcast to authenticated users only
 broadcastToAuthenticated(event: string, data: any): void {
  if (!this.io) {
   logger.warn('Socket.IO not initialized, cannot broadcast to authenticated');
   return;
  }

  this.io.sockets.sockets.forEach((socket) => {
   if (socket.data.authenticated) {
    socket.emit(event, data);
   }
  });
  logger.debug(`Broadcasted ${event} to authenticated clients`);
 }

 // Get connection stats
 getConnectionStats(): { total: number; authenticated: number } {
  if (!this.io) {
   return { total: 0, authenticated: 0 };
  }

  let authenticated = 0;
  this.io.sockets.sockets.forEach((socket) => {
   if (socket.data.authenticated) {
    authenticated++;
   }
  });

  return {
   total: this.io.sockets.sockets.size,
   authenticated,
  };
 }

 // Graceful shutdown
 async shutdown(): Promise<void> {
  if (this.io) {
   this.io.close();
   logger.info('PubSub service shutdown complete');
  }
 }
}

// Create and export singleton instance
export const pubSubService = new PubSubService();
