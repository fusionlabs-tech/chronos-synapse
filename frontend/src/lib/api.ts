import {
 Job,
 JobExecution,
 JobsResponse,
 JobFormData,
 JobFilters,
 SystemHealth,
 DashboardStats,
 MetricsData,
 AIAnalysisResult,
 AnomalyDetectionResult,
 PredictiveScheduleResult,
 SmartRetryResult,
 PerformanceOptimizationResult,
 JobPerformanceMetrics,
 SystemPerformanceMetrics,
 User,
 Notification,
 NotificationResponse,
} from '@/types';

const API_BASE_URL =
 process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
 private async request<T>(
  endpoint: string,
  options: RequestInit = {}
 ): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Add auth header
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
   'Content-Type': 'application/json',
   ...(options.headers as Record<string, string>),
  };

  if (token) {
   headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
   headers,
   ...options,
  });

  // Handle token expiration
  if (response.status === 401) {
   // Store current path for redirect after login
   const currentPath = window.location.pathname + window.location.search;
   if (currentPath !== '/auth/login' && currentPath !== '/auth/register') {
    sessionStorage.setItem('redirectAfterLogin', currentPath);
   }

   // Clear auth data
   localStorage.removeItem('auth_token');

   // Redirect to login
   window.location.href = '/auth/login';
   throw new Error('Unauthorized - Token expired');
  }

  if (!response.ok) {
   throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
 }

 // Job endpoints
 async getJobs(
  filters?: JobFilters & {
   page?: number;
   limit?: number;
   view?: 'list' | 'grid';
  }
 ): Promise<JobsResponse> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('q', filters.search);
  if (filters?.enabled !== undefined)
   params.append('enabled', filters.enabled.toString());
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.teamId) params.append('teamId', filters.teamId);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.view) params.append('view', filters.view);

  const queryString = params.toString();
  const endpoint = `/jobs${queryString ? `?${queryString}` : ''}`;

  return this.request<JobsResponse>(endpoint);
 }

 async getJob(jobId: string): Promise<Job> {
  const response = await this.request<{ job: Job }>(`/jobs/${jobId}`);
  return response.job;
 }

 async createJob(jobData: JobFormData): Promise<Job> {
  const response = await this.request<{ job: Job }>('/jobs', {
   method: 'POST',
   body: JSON.stringify(jobData),
  });
  return response.job;
 }

 async updateJob(jobId: string, updates: Partial<JobFormData>): Promise<Job> {
  const response = await this.request<{ job: Job }>(`/jobs/${jobId}`, {
   method: 'PUT',
   body: JSON.stringify(updates),
  });
  return response.job;
 }

 async deleteJob(jobId: string): Promise<void> {
  await this.request(`/jobs/${jobId}`, {
   method: 'DELETE',
  });
 }

 async toggleJob(jobId: string, enabled: boolean): Promise<Job> {
  return this.updateJob(jobId, { enabled });
 }

 async executeJob(
  jobId: string
 ): Promise<{ success: boolean; message: string }> {
  return this.request<{ success: boolean; message: string }>(
   `/jobs/${jobId}/execute`,
   {
    method: 'POST',
    body: JSON.stringify({}),
   }
  );
 }

 // Execution endpoints
 async getJobExecutions(jobId: string, limit = 10): Promise<JobExecution[]> {
  const response = await this.request<{ executions: JobExecution[] }>(
   `/jobs/${jobId}/executions?limit=${limit}`
  );
  return response.executions;
 }

 async getExecution(jobId: string, executionId: string): Promise<JobExecution> {
  return this.request<JobExecution>(`/jobs/${jobId}/executions/${executionId}`);
 }

 async getJobStatus(jobId: string): Promise<{
  job: Job | null;
  currentExecution: JobExecution | null;
  isRunning: boolean;
  lastExecution: JobExecution | null;
  nextRun: string | null;
  retryCount: number;
  errorCount: number;
 }> {
  return this.request(`/jobs/${jobId}/status`);
 }

 async getJobPerformanceMetrics(
  jobId: string,
  days: number = 30
 ): Promise<JobPerformanceMetrics> {
  return this.request(`/jobs/${jobId}/performance?days=${days}`);
 }

 async getSystemPerformanceMetrics(
  days: number = 30
 ): Promise<SystemPerformanceMetrics> {
  return this.request(`/analytics/performance?days=${days}`);
 }

 async getExecutionLogs(
  jobId: string,
  executionId: string,
  limit = 100
 ): Promise<{ logs: any[] }> {
  return this.request<{ logs: any[] }>(
   `/jobs/${jobId}/executions/${executionId}/logs?limit=${limit}`
  );
 }

 // Metrics endpoints
 async getDashboardStats(): Promise<DashboardStats> {
  return this.request<DashboardStats>('/analytics/dashboard');
 }

 async getMetrics(
  metric: string,
  fromTimestamp: number,
  toTimestamp: number
 ): Promise<MetricsData[]> {
  const params = new URLSearchParams({
   metric,
   from: fromTimestamp.toString(),
   to: toTimestamp.toString(),
  });

  return this.request<MetricsData[]>(`/analytics/metrics?${params}`);
 }

 // Health endpoints
 async getSystemHealth(): Promise<SystemHealth> {
  return this.request<SystemHealth>('/health/redis');
 }

 async ping(): Promise<{ status: string }> {
  return this.request<{ status: string }>('/health');
 }

 // Demo endpoints
 async createSampleJobs(): Promise<{ message: string; count: number }> {
  return this.request<{ message: string; count: number }>(
   '/demo/create-sample-jobs',
   {
    method: 'POST',
   }
  );
 }

 // AI Analysis endpoints
 async performComprehensiveAnalysis(jobId: string): Promise<AIAnalysisResult> {
  return this.request<AIAnalysisResult>(`/ai/analyze-job/${jobId}`, {
   method: 'POST',
   body: JSON.stringify({}),
  });
 }

 async detectAnomalies(
  jobId: string,
  executionId: string
 ): Promise<AnomalyDetectionResult> {
  return this.request<AnomalyDetectionResult>(`/ai/detect-anomalies/${jobId}`, {
   method: 'POST',
   body: JSON.stringify({ executionId }),
  });
 }

 async suggestOptimalSchedule(
  jobId: string
 ): Promise<PredictiveScheduleResult> {
  return this.request<PredictiveScheduleResult>(
   `/ai/suggest-schedule/${jobId}`
  );
 }

 async determineRetryStrategy(
  jobId: string,
  executionId: string,
  attempt: number
 ): Promise<SmartRetryResult> {
  return this.request<SmartRetryResult>(`/ai/retry-strategy/${jobId}`, {
   method: 'POST',
   body: JSON.stringify({ executionId, attempt }),
  });
 }

 async analyzePerformance(
  jobId: string
 ): Promise<PerformanceOptimizationResult> {
  return this.request<PerformanceOptimizationResult>(
   `/ai/optimize-performance/${jobId}`
  );
 }

 async getAIAnalysis(
  jobId: string
 ): Promise<{ analysis: AIAnalysisResult | null }> {
  return this.request<{ analysis: AIAnalysisResult | null }>(
   `/ai/analysis/${jobId}`
  );
 }

 async getAllAIAnalyses(): Promise<{ analyses: AIAnalysisResult[] }> {
  return this.request<{ analyses: AIAnalysisResult[] }>('/ai/analyses');
 }

 // User Profile Management
 async updateProfile(profileData: {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
 }): Promise<User> {
  return this.request<User>('/users/profile', {
   method: 'PUT',
   body: JSON.stringify(profileData),
  });
 }

 async changePassword(
  currentPassword: string,
  newPassword: string
 ): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>('/users/change-password', {
   method: 'POST',
   body: JSON.stringify({ currentPassword, newPassword }),
  });
 }

 // API Key Management
 async getApiKeys(): Promise<{
  keys: Array<{
   id: string;
   name: string;
   key: string;
   permissions: string[];
   isActive: boolean;
   createdAt: string;
   lastUsedAt?: string;
  }>;
 }> {
  return this.request('/users/api-keys');
 }

 async createApiKey(
  name: string,
  permissions: string[] = []
 ): Promise<{
  id: string;
  key: string;
  name: string;
  permissions: string[];
 }> {
  return this.request('/users/api-keys', {
   method: 'POST',
   body: JSON.stringify({ name, permissions }),
  });
 }

 async deleteApiKey(apiKeyId: string): Promise<{ success: boolean }> {
  return this.request(`/users/api-keys/${apiKeyId}`, {
   method: 'DELETE',
  });
 }

 // Admin Management
 async getAdminUsers(): Promise<{ users: User[] }> {
  return this.request('/admin/users');
 }

 async getAdminSystemStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  activeJobs: number;
  totalExecutions: number;
  systemSuccessRate: number;
  recentActivity: Array<{
   type: string;
   description: string;
   timestamp: string;
   userId: string;
  }>;
 }> {
  return this.request('/admin/system-stats');
 }

 async updateUserStatus(
  userId: string,
  isActive: boolean
 ): Promise<{ success: boolean }> {
  return this.request(`/admin/users/${userId}/status`, {
   method: 'PUT',
   body: JSON.stringify({ isActive }),
  });
 }

 async deleteUser(userId: string): Promise<{ success: boolean }> {
  return this.request(`/admin/users/${userId}`, {
   method: 'DELETE',
  });
 }

 // Notification endpoints
 async getNotifications(limit = 20, offset = 0): Promise<NotificationResponse> {
  const response = await this.request<{
   success: boolean;
   data: NotificationResponse;
  }>(`/notifications?limit=${limit}&offset=${offset}`);
  return response.data;
 }

 async markNotificationAsRead(
  notificationId: string
 ): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>(
   `/notifications/${notificationId}/read`,
   {
    method: 'PUT',
   }
  );
 }

 async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>('/notifications/read-all', {
   method: 'PUT',
  });
 }

 async deleteNotification(
  notificationId: string
 ): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>(
   `/notifications/${notificationId}`,
   {
    method: 'DELETE',
   }
  );
 }

 // Rate Limiting Admin Methods
 async getRateLimitStats(): Promise<{
  stats: {
   totalKeys: number;
   activeKeys: number;
   blockedKeys: number;
   totalRequests: number;
  };
 }> {
  return this.request<{
   stats: {
    totalKeys: number;
    activeKeys: number;
    blockedKeys: number;
    totalRequests: number;
   };
  }>('/admin/rate-limits/stats');
 }

 async getRateLimitKeys(pattern?: string): Promise<{
  keys: Array<{
   key: string;
   info: {
    key: string;
    current: number;
    limit: number;
    remaining: number;
    resetTime: number;
    ttl: number;
   } | null;
  }>;
 }> {
  const params = pattern ? `?pattern=${encodeURIComponent(pattern)}` : '';
  return this.request<{
   keys: Array<{
    key: string;
    info: {
     key: string;
     current: number;
     limit: number;
     remaining: number;
     resetTime: number;
     ttl: number;
    } | null;
   }>;
  }>(`/admin/rate-limits/keys${params}`);
 }

 async clearRateLimit(key: string): Promise<{
  success: boolean;
  message: string;
 }> {
  return this.request<{ success: boolean; message: string }>(
   `/admin/rate-limits/clear/${encodeURIComponent(key)}`,
   { method: 'DELETE' }
  );
 }

 async clearAllRateLimits(): Promise<{
  success: boolean;
  message: string;
  clearedCount: number;
 }> {
  return this.request<{
   success: boolean;
   message: string;
   clearedCount: number;
  }>('/admin/rate-limits/clear-all', { method: 'DELETE' });
 }
}

export const apiClient = new ApiClient();
