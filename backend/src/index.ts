// Load environment variables FIRST - before any other imports!
import 'dotenv/config';

// Now import everything else
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from './utils/logger';
import { redisService } from './services/RedisService';
import { pubSubService } from './services/PubSubService';
import registerModules from './modules';

// Create Fastify instance
const fastify = Fastify({
 logger: {
  level: 'info',
  ...(process.env.NODE_ENV === 'development' && {
   transport: {
    target: 'pino-pretty',
   },
  }),
 },
});

// Register plugins
fastify.register(cors, {
 origin: (origin, cb) => {
  const allowed = new Set([
   process.env.FRONTEND_URL || 'http://localhost:3000',
   'http://localhost:3000',
   'http://127.0.0.1:3000',
   'http://localhost:3001',
   'http://127.0.0.1:3001',
  ]);
  if (!origin || allowed.has(origin)) {
   cb(null, true);
  } else {
   cb(null, false);
  }
 },
 credentials: true,
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
 allowedHeaders: [
  'Content-Type',
  'Authorization',
  'authorization',
  'Accept',
  'X-Requested-With',
 ],
 exposedHeaders: ['Content-Length', 'Content-Type'],
 preflightContinue: false,
 optionsSuccessStatus: 204,
});

// Register all modules
fastify.register(registerModules);

const start = async () => {
 try {
  // Connect to Redis with retry mechanism
  let redisConnected = false;
  let retryCount = 0;
  const maxRetries = 5;

  while (!redisConnected && retryCount < maxRetries) {
   try {
    await redisService.connect();
    redisConnected = true;
    logger.info('Redis connected successfully');
    // Ensure indexes exist (recreate execution index to correct schema)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try {
     (redisService as any).createExecutionSearchIndex &&
      (await (redisService as any).createExecutionSearchIndex());
    } catch {}
   } catch (error) {
    retryCount++;
    logger.error(`Redis connection attempt ${retryCount} failed:`, error);

    if (retryCount < maxRetries) {
     const delay = Math.min(retryCount * 1000, 5000);
     logger.info(`Retrying Redis connection in ${delay}ms...`);
     await new Promise((resolve) => setTimeout(resolve, delay));
    } else {
     logger.error('Failed to connect to Redis after maximum retries');
     throw error;
    }
   }
  }

  // Initialize Pub/Sub service
  await pubSubService.initialize(fastify);

  // Start the server
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  const host = process.env.HOST || '0.0.0.0';

  await fastify.listen({ port, host });
  logger.info(`Server is running on http://${host}:${port}`);

  // Graceful shutdown
  const gracefulShutdown = async () => {
   logger.info('Shutting down gracefully...');
   await redisService.disconnect();
   await pubSubService.shutdown();
   process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
 } catch (error) {
  logger.error('Failed to start server:', error);
  process.exit(1);
 }
};

start();
