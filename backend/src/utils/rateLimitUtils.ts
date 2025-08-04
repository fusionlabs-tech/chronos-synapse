import { redisService } from '../services/RedisService';
import { logger } from './logger';

export interface RateLimitInfo {
 key: string;
 current: number;
 limit: number;
 remaining: number;
 resetTime: number;
 ttl: number;
}

export interface RateLimitStats {
 totalKeys: number;
 activeKeys: number;
 blockedKeys: number;
 totalRequests: number;
}

export class RateLimitUtils {
 /**
  * Get current rate limit information for a key
  */
 static async getRateLimitInfo(key: string): Promise<RateLimitInfo | null> {
  try {
   const redisKey = `rate_limit:${key}`;
   const current = await redisService.redis.get(redisKey);
   const ttl = await redisService.redis.ttl(redisKey);

   if (!current) {
    return null;
   }

   const count = parseInt(current);
   const resetTime = Date.now() + ttl * 1000;

   // Determine limit based on key pattern
   let limit = 10; // default
   if (key.includes('password-reset')) {
    limit = 5;
   } else if (key.includes('login')) {
    limit = 10;
   } else if (key.includes('registration')) {
    limit = 3;
   }

   return {
    key,
    current: count,
    limit,
    remaining: Math.max(0, limit - count),
    resetTime,
    ttl,
   };
  } catch (error) {
   logger.error('Failed to get rate limit info:', error);
   return null;
  }
 }

 /**
  * Get rate limiting statistics
  */
 static async getRateLimitStats(): Promise<RateLimitStats> {
  try {
   const keys = await redisService.redis.keys('rate_limit:*');
   let totalRequests = 0;
   let blockedKeys = 0;

   for (const key of keys) {
    const count = await redisService.redis.get(key);
    if (count) {
     const countNum = parseInt(count);
     totalRequests += countNum;

     // Determine if this key is blocked
     const keyType = key.split(':')[1];
     let limit = 10;
     if (keyType.includes('password-reset')) {
      limit = 5;
     } else if (keyType.includes('login')) {
      limit = 10;
     } else if (keyType.includes('registration')) {
      limit = 3;
     }

     if (countNum >= limit) {
      blockedKeys++;
     }
    }
   }

   return {
    totalKeys: keys.length,
    activeKeys: keys.length - blockedKeys,
    blockedKeys,
    totalRequests,
   };
  } catch (error) {
   logger.error('Failed to get rate limit stats:', error);
   return {
    totalKeys: 0,
    activeKeys: 0,
    blockedKeys: 0,
    totalRequests: 0,
   };
  }
 }

 /**
  * Clear rate limit for a specific key
  */
 static async clearRateLimit(key: string): Promise<boolean> {
  try {
   const redisKey = `rate_limit:${key}`;
   await redisService.redis.del(redisKey);
   logger.info(`Rate limit cleared for key: ${key}`);
   return true;
  } catch (error) {
   logger.error('Failed to clear rate limit:', error);
   return false;
  }
 }

 /**
  * Clear all rate limits (admin function)
  */
 static async clearAllRateLimits(): Promise<number> {
  try {
   const keys = await redisService.redis.keys('rate_limit:*');
   if (keys.length > 0) {
    await redisService.redis.del(keys);
    logger.info(`Cleared ${keys.length} rate limit keys`);
   }
   return keys.length;
  } catch (error) {
   logger.error('Failed to clear all rate limits:', error);
   return 0;
  }
 }

 /**
  * Get rate limit keys by pattern
  */
 static async getRateLimitKeys(pattern: string = '*'): Promise<string[]> {
  try {
   const keys = await redisService.redis.keys(`rate_limit:${pattern}`);
   return keys.map((key) => key.replace('rate_limit:', ''));
  } catch (error) {
   logger.error('Failed to get rate limit keys:', error);
   return [];
  }
 }

 /**
  * Check if a key is currently rate limited
  */
 static async isRateLimited(key: string): Promise<boolean> {
  try {
   const info = await this.getRateLimitInfo(key);
   return info ? info.current >= info.limit : false;
  } catch (error) {
   logger.error('Failed to check rate limit status:', error);
   return false;
  }
 }

 /**
  * Get remaining requests for a key
  */
 static async getRemainingRequests(key: string): Promise<number> {
  try {
   const info = await this.getRateLimitInfo(key);
   return info ? info.remaining : 10; // Default limit
  } catch (error) {
   logger.error('Failed to get remaining requests:', error);
   return 0;
  }
 }

 /**
  * Get time until rate limit resets
  */
 static async getResetTime(key: string): Promise<number> {
  try {
   const info = await this.getRateLimitInfo(key);
   return info ? info.ttl : 0;
  } catch (error) {
   logger.error('Failed to get reset time:', error);
   return 0;
  }
 }
}
