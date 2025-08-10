export interface HealthStatus {
 status: 'healthy' | 'unhealthy';
 timestamp: string;
 services: {
  redis: 'connected' | 'disconnected';
  scheduler: 'running' | 'stopped';
 };
 stats: {
  scheduledJobs: number;
  runningExecutions: number;
 };
 error?: string;
}

export interface RedisHealthInfo {
 connected: boolean;
 info: Record<string, string>;
 keys: number;
 reconnectAttempts: number;
 error?: string;
}
