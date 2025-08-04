import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';
import { redisService } from '../services/RedisService';

interface RateLimitOptions {
 windowMs: number; // Time window in milliseconds
 max: number; // Max requests per window
 message?: string;
 keyGenerator?: (request: FastifyRequest) => string;
}

export function createRateLimit(options: RateLimitOptions) {
 return async (request: FastifyRequest, reply: FastifyReply) => {
  const key = options.keyGenerator
   ? options.keyGenerator(request)
   : request.ip || 'unknown';

  try {
   // Use Redis for rate limiting
   const redisKey = `rate_limit:${key}`;

   // Get current count from Redis
   const currentCount = await redisService.redis.get(redisKey);
   const count = currentCount ? parseInt(currentCount) : 0;

   if (count >= options.max) {
    // Rate limit exceeded
    logger.warn(
     `Rate limit exceeded for ${key}: ${count}/${options.max} requests`
    );

    // Get TTL to calculate retry after
    const ttl = await redisService.redis.ttl(redisKey);
    const retryAfter = Math.max(0, ttl);

    return reply.status(429).send({
     error: 'Too Many Requests',
     message: options.message || 'Rate limit exceeded. Please try again later.',
     retryAfter,
    });
   }

   // Increment count and set expiration atomically
   const newCount = await redisService.redis.incr(redisKey);

   // Set expiration only if this is the first increment
   if (newCount === 1) {
    await redisService.redis.expire(
     redisKey,
     Math.ceil(options.windowMs / 1000)
    ); // Convert to seconds
   }

   // Log if approaching limit
   if (newCount >= options.max * 0.8) {
    logger.info(
     `Rate limit warning for ${key}: ${newCount}/${options.max} requests`
    );
   }
  } catch (error) {
   logger.error('Rate limiting error:', error);
   // If Redis fails, allow the request to proceed
   // In production, you might want to fail closed instead
  }
 };
}

// Rate limit for password reset requests (5 requests per hour per IP)
export const passwordResetRateLimit = createRateLimit({
 windowMs: 60 * 60 * 1000, // 1 hour
 max: 5,
 message: 'Too many password reset requests. Please try again in an hour.',
 keyGenerator: (request) => `password-reset:${request.ip || 'unknown'}`,
});

// Rate limit for login attempts (10 requests per 15 minutes per IP)
export const loginRateLimit = createRateLimit({
 windowMs: 15 * 60 * 1000, // 15 minutes
 max: 10,
 message: 'Too many login attempts. Please try again in 15 minutes.',
 keyGenerator: (request) => `login:${request.ip || 'unknown'}`,
});

// Rate limit for registration (3 requests per hour per IP)
export const registrationRateLimit = createRateLimit({
 windowMs: 60 * 60 * 1000, // 1 hour
 max: 3,
 message: 'Too many registration attempts. Please try again in an hour.',
 keyGenerator: (request) => `registration:${request.ip || 'unknown'}`,
});

// No cleanup needed with Redis - TTL handles expiration automatically
