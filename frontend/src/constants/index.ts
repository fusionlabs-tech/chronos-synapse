// API Configuration
export const API_CONFIG = {
 BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
 TIMEOUT: 10000,
 RETRY_ATTEMPTS: 3,
} as const;

// SSE Configuration
export const SSE_CONFIG = {
 URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
 RECONNECT_INTERVAL: 5000,
 MAX_RECONNECT_ATTEMPTS: 10,
} as const;

// Job Status Constants
export const JOB_STATUS = {
 RUNNING: 'running',
 SUCCESS: 'success',
 FAILED: 'failed',
 TIMEOUT: 'timeout',
 CANCELLED: 'cancelled',
} as const;

// SSE Reconnection Interval (in milliseconds)
export const SSE_RECONNECT_INTERVAL = 5000; // 5 seconds

// Pagination
export const PAGINATION = {
 DEFAULT_PAGE_SIZE: 20,
 MAX_PAGE_SIZE: 100,
 PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Chart Configuration
export const CHART_CONFIG = {
 DEFAULT_COLORS: [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
 ],
 METRICS_RETENTION_DAYS: 7,
 DEFAULT_TIME_RANGE: '24h',
 TIME_RANGES: [
  { label: '1 Hour', value: '1h' },
  { label: '6 Hours', value: '6h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
 ],
} as const;

// Form Validation
export const VALIDATION = {
 JOB_NAME: {
  MIN_LENGTH: 1,
  MAX_LENGTH: 100,
 },
 JOB_DESCRIPTION: {
  MAX_LENGTH: 500,
 },
 JOB_COMMAND: {
  MIN_LENGTH: 1,
  MAX_LENGTH: 1000,
 },
 JOB_TIMEOUT: {
  MIN: 1,
  MAX: 3600, // 1 hour in seconds
 },
 JOB_RETRIES: {
  MIN: 0,
  MAX: 10,
 },
 TAG_NAME: {
  MIN_LENGTH: 1,
  MAX_LENGTH: 50,
 },
} as const;

// Common Cron Expressions
export const COMMON_CRON_EXPRESSIONS = [
 { label: 'Every minute', value: '* * * * *' },
 { label: 'Every 5 minutes', value: '*/5 * * * *' },
 { label: 'Every 15 minutes', value: '*/15 * * * *' },
 { label: 'Every 30 minutes', value: '*/30 * * * *' },
 { label: 'Every hour', value: '0 * * * *' },
 { label: 'Every 6 hours', value: '0 */6 * * *' },
 { label: 'Every 12 hours', value: '0 */12 * * *' },
 { label: 'Daily at midnight', value: '0 0 * * *' },
 { label: 'Daily at 6 AM', value: '0 6 * * *' },
 { label: 'Daily at 2 AM', value: '0 2 * * *' },
 { label: 'Weekly on Sunday', value: '0 0 * * 0' },
 { label: 'Monthly on 1st', value: '0 0 1 * *' },
] as const;

// Dashboard Metrics
export const METRICS_CONFIG = {
 DASHBOARD_CARDS: [
  {
   id: 'total_jobs',
   title: 'Total Jobs',
   description: 'Total number of jobs',
   icon: '📋',
  },
  {
   id: 'active_jobs',
   title: 'Active Jobs',
   description: 'Currently enabled jobs',
   icon: '🔄',
  },
  {
   id: 'success_rate',
   title: 'Success Rate',
   description: 'Job execution success rate',
   icon: '✅',
   format: 'percentage',
  },
  {
   id: 'avg_duration',
   title: 'Avg Duration',
   description: 'Average execution time',
   icon: '⏱️',
   format: 'duration',
  },
 ],
 CHART_METRICS: [
  {
   id: 'ts:jobs:success_rate',
   title: 'Success Rate Over Time',
   type: 'line',
   color: '#10b981',
  },
  {
   id: 'ts:jobs:avg_duration',
   title: 'Average Duration',
   type: 'area',
   color: '#3b82f6',
  },
  {
   id: 'ts:jobs:total',
   title: 'Total Jobs',
   type: 'bar',
   color: '#8b5cf6',
  },
 ],
} as const;

// Theme and UI
export const THEME = {
 COLORS: {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4',
 },
 BORDER_RADIUS: {
  SM: '0.375rem',
  DEFAULT: '0.5rem',
  LG: '0.75rem',
 },
} as const;

// Navigation
export const NAVIGATION: Array<{
 name: string;
 href: string;
 icon: string;
 adminOnly?: boolean;
}> = [
 {
  name: 'Dashboard',
  href: '/dashboard',
  icon: '📊',
 },
 {
  name: 'Jobs',
  href: '/jobs',
  icon: '⚙️',
 },
 {
  name: 'Analytics',
  href: '/analytics',
  icon: '📈',
 },
 {
  name: 'AI Insights',
  href: '/ai-insights',
  icon: '🤖',
 },
 {
  name: 'Admin',
  href: '/dashboard/admin',
  icon: '🛡️',
  adminOnly: true,
 },
] as const;

// Local Storage Keys
export const STORAGE_KEYS = {
 THEME: 'chronos-theme',
 JOB_FILTERS: 'chronos-job-filters',
 DASHBOARD_LAYOUT: 'chronos-dashboard-layout',
 USER_PREFERENCES: 'chronos-user-preferences',
} as const;
