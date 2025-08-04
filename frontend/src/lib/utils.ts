import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind CSS class utility
export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

// Date and time utilities
export function formatDateTime(dateString: string): string {
 return new Date(dateString).toLocaleString();
}

export function formatRelativeTime(dateString: string): string {
 const now = new Date();
 const date = new Date(dateString);
 const diff = now.getTime() - date.getTime();

 const seconds = Math.floor(diff / 1000);
 const minutes = Math.floor(seconds / 60);
 const hours = Math.floor(minutes / 60);
 const days = Math.floor(hours / 24);

 if (days > 0) return `${days}d ago`;
 if (hours > 0) return `${hours}h ago`;
 if (minutes > 0) return `${minutes}m ago`;
 return `${seconds}s ago`;
}

export function formatDuration(milliseconds: number): string {
 if (milliseconds < 1000) return `${milliseconds}ms`;

 const seconds = Math.floor(milliseconds / 1000);
 const minutes = Math.floor(seconds / 60);
 const hours = Math.floor(minutes / 60);

 if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
 if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
 return `${seconds}s`;
}

export function getNextRunTime(schedule: string): string {
 // This is a simplified implementation
 // In a real app, you'd use a proper cron parser like 'cron-parser'
 const cronMap: Record<string, string> = {
  '*/5 * * * *': 'Every 5 minutes',
  '0 * * * *': 'Every hour',
  '0 2 * * *': 'Daily at 2:00 AM',
  '0 3 * * 0': 'Weekly on Sunday at 3:00 AM',
  '0 0 1 * *': 'Monthly on the 1st',
 };

 return cronMap[schedule] || schedule;
}

// Status utilities
export function getStatusColor(status: string): string {
 const statusColors: Record<string, string> = {
  running: 'bg-blue-100 text-blue-800 border-blue-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  timeout: 'bg-orange-100 text-orange-800 border-orange-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
 };

 return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getStatusIcon(status: string): string {
 const statusIcons: Record<string, string> = {
  running: '⏳',
  success: '✅',
  failed: '❌',
  timeout: '⏰',
  cancelled: '⏹️',
 };

 return statusIcons[status] || '❓';
}

// Data formatting utilities
export function formatBytes(bytes: number): string {
 if (bytes === 0) return '0 Bytes';

 const k = 1024;
 const sizes = ['Bytes', 'KB', 'MB', 'GB'];
 const i = Math.floor(Math.log(bytes) / Math.log(k));

 return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatPercentage(value: number): string {
 return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(num: number): string {
 if (num >= 1000000) {
  return (num / 1000000).toFixed(1) + 'M';
 }
 if (num >= 1000) {
  return (num / 1000).toFixed(1) + 'K';
 }
 return num.toString();
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
 return array.reduce((groups, item) => {
  const group = String(item[key]);
  groups[group] = groups[group] || [];
  groups[group].push(item);
  return groups;
 }, {} as Record<string, T[]>);
}

// Validation utilities
export function isValidCronExpression(cron: string): boolean {
 // Basic cron validation (simplified)
 const cronRegex =
  /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
 return cronRegex.test(cron);
}

// Local storage utilities
export function getFromStorage(key: string): string | null {
 if (typeof window === 'undefined') return null;
 return localStorage.getItem(key);
}

export function setToStorage(key: string, value: string): void {
 if (typeof window === 'undefined') return;
 localStorage.setItem(key, value);
}

export function removeFromStorage(key: string): void {
 if (typeof window === 'undefined') return;
 localStorage.removeItem(key);
}
