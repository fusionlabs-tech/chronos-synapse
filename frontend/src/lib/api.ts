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

  // Handle token expiration - try to refresh first
  if (response.status === 401) {
   const refreshToken = localStorage.getItem('refresh_token');

   if (refreshToken) {
    try {
     // Try to refresh the token
     const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
     });

     if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      localStorage.setItem('auth_token', refreshData.token);

      // Retry the original request with new token
      const retryResponse = await fetch(url, {
       headers: {
        ...headers,
        Authorization: `Bearer ${refreshData.token}`,
       },
       ...options,
      });

      if (retryResponse.ok) {
       return retryResponse.json();
      }
     }
    } catch (refreshError) {
     // Refresh failed, clear tokens and let modal handle it
     localStorage.removeItem('auth_token');
     localStorage.removeItem('refresh_token');
     throw new Error('Unauthorized - Token expired');
    }
   }

   // No refresh token or refresh failed - clear auth data
   localStorage.removeItem('auth_token');
   localStorage.removeItem('refresh_token');
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

  type Wrapped = { success?: boolean; data?: JobsResponse };
  const raw = await this.request<JobsResponse | Wrapped>(endpoint);
  // Normalize response: support both { jobs, pagination } and { success, data: { jobs, pagination } }
  if ((raw as JobsResponse)?.jobs) return raw as JobsResponse;
  if ((raw as Wrapped)?.data?.jobs) {
   const d = (raw as Wrapped).data as JobsResponse;
   return { jobs: d.jobs, pagination: d.pagination, view: d.view };
  }
  return { jobs: [] } as JobsResponse;
 }

 async getJob(jobId: string): Promise<{
  job: Job;
  fileContent?: { filename: string; content: string; updatedAt: string } | null;
 }> {
  type Wrapped = { success?: boolean; data?: Job };
  const raw = await this.request<
   | {
      job: Job;
      fileContent?: {
       filename: string;
       content: string;
       updatedAt: string;
      } | null;
     }
   | Wrapped
  >(`/jobs/${jobId}`);
  if ((raw as any)?.job) return raw as any;
  if ((raw as Wrapped)?.data) {
   return { job: (raw as Wrapped).data as Job };
  }
  throw new Error('Invalid job response');
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
  type Wrapped = { success?: boolean; data?: JobExecution[] };
  const raw = await this.request<{ executions: JobExecution[] } | Wrapped>(
   `/jobs/${jobId}/executions?limit=${limit}`
  );
  if ((raw as any)?.executions)
   return (raw as any).executions as JobExecution[];
  if ((raw as Wrapped)?.data) return (raw as Wrapped).data as JobExecution[];
  return [];
 }

 async getExecution(jobId: string, executionId: string): Promise<JobExecution> {
  const endpoint = `/jobs/${encodeURIComponent(
   jobId
  )}/executions/${encodeURIComponent(executionId)}`;
  type Wrapped = { success?: boolean; data?: JobExecution };
  const raw = await this.request<JobExecution | Wrapped>(endpoint);
  if ((raw as Wrapped)?.data) return (raw as Wrapped).data as JobExecution;
  return raw as JobExecution;
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

 // Metrics endpoints
 async getDashboardStats(days: number = 1): Promise<DashboardStats> {
  type Wrapped = { success?: boolean; data?: any };
  const raw = await this.request<DashboardStats | Wrapped>(
   `/analytics/dashboard?days=${encodeURIComponent(String(days))}`
  );
  const src: any = (raw as any)?.data ? (raw as any).data : raw;
  return {
   totalJobs: Number(src?.totalJobs ?? 0),
   activeJobs: Number(src?.activeJobs ?? 0),
   recentExecutions: Number(src?.recentExecutions ?? src?.totalExecutions ?? 0),
   successRate: Number(src?.successRate ?? 0),
   avgDuration: Number(src?.avgDuration ?? src?.averageExecutionTime ?? 0),
  } as DashboardStats;
 }

 async getMetrics(
  metric: string,
  fromTimestamp: number,
  toTimestamp: number
 ): Promise<MetricsData[]> {
  const params = new URLSearchParams({
   from: fromTimestamp.toString(),
   to: toTimestamp.toString(),
  });
  const safeMetric = encodeURIComponent(metric);
  const raw = await this.request<any>(
   `/analytics/timeseries/${safeMetric}?${params}`
  );
  const arr: any[] = Array.isArray(raw?.data)
   ? raw.data
   : Array.isArray(raw)
   ? raw
   : [];
  return arr.map((tuple) => {
   if (Array.isArray(tuple) && tuple.length >= 2) {
    return {
     timestamp: Number(tuple[0]),
     value: Number(tuple[1]),
    } as MetricsData;
   }
   // Fallback if backend ever returns objects
   return {
    timestamp: Number((tuple as any)?.timestamp),
    value: Number((tuple as any)?.value),
   } as MetricsData;
  });
 }

 async getUserTimeseries(days: number): Promise<{
  executions: MetricsData[];
  success: MetricsData[];
  failed: MetricsData[];
 }> {
  const raw = await this.request<{
   success: boolean;
   data: {
    executions: Array<[number, number]>;
    success: Array<[number, number]>;
    failed: Array<[number, number]>;
   };
  }>(`/analytics/user-timeseries?days=${encodeURIComponent(String(days))}`);
  const mapTuples = (arr: Array<[number, number]>): MetricsData[] =>
   arr.map(([t, v]) => ({ timestamp: Number(t), value: Number(v) }));
  const data = raw?.data || { executions: [], success: [], failed: [] };
  return {
   executions: mapTuples(data.executions || []),
   success: mapTuples(data.success || []),
   failed: mapTuples(data.failed || []),
  };
 }

 async getRecentExecutions(days = 1, limit = 10): Promise<JobExecution[]> {
  const qs = new URLSearchParams({ days: String(days), limit: String(limit) });
  const raw = await this.request<{ success: boolean; data: JobExecution[] }>(
   `/analytics/recent?${qs}`
  );
  return raw?.data || [];
 }

 // Health endpoints
 async getSystemHealth(): Promise<SystemHealth> {
  return this.request<SystemHealth>('/health/redis');
 }

 async ping(): Promise<{ status: string }> {
  return this.request<{ status: string }>('/health');
 }

 // AI Analysis endpoints

 // User Profile Management
 async updateProfile(profileData: {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
 }): Promise<User> {
  return this.request<User>('/auth/profile', {
   method: 'PUT',
   body: JSON.stringify(profileData),
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

 async createApiKey(name: string): Promise<{
  id: string;
  key: string;
  name: string;
  permissions: string[];
 }> {
  return this.request('/users/api-keys', {
   method: 'POST',
   body: JSON.stringify({ name }),
  });
 }

 async deleteApiKey(apiKeyId: string): Promise<{ success: boolean }> {
  return this.request(`/users/api-keys/${apiKeyId}`, {
   method: 'DELETE',
  });
 }

 // AI Key Management
 async getAiKeys(): Promise<
  | {
     keys: Array<{
      id: string;
      provider: string;
      alias?: string;
      maskedKey: string;
      defaultModel?: string;
      endpointBase?: string;
      orgId?: string;
      isActive: boolean;
      createdAt: string;
      lastUsedAt?: string;
     }>;
    }
  | { success: boolean; keys: any[] }
 > {
  return this.request('/users/ai-keys');
 }

 async createAiKey(payload: {
  provider: string;
  alias?: string;
  apiKey: string;
  defaultModel?: string;
  endpointBase?: string;
  orgId?: string;
 }): Promise<{ success: boolean; id: string }> {
  return this.request('/users/ai-keys', {
   method: 'POST',
   body: JSON.stringify(payload),
  });
 }

 async deleteAiKey(id: string): Promise<{ success: boolean }> {
  return this.request(`/users/ai-keys/${encodeURIComponent(id)}`, {
   method: 'DELETE',
  });
 }

 async testAiKey(id: string): Promise<{ success: boolean; ok: boolean }> {
  return this.request(`/users/ai-keys/${encodeURIComponent(id)}/test`, {
   method: 'POST',
  });
 }

 // AI Analysis Methods
 async runAIAnalysis(jobId: string): Promise<AIAnalysisResult> {
  return this.request(`/ai/analyze-job/${jobId}`, {
   method: 'POST',
  });
 }

 async getAIAnalysis(jobId: string): Promise<AIAnalysisResult | null> {
  try {
   return await this.request(`/ai/analysis/${jobId}`);
  } catch (error) {
   // Return null if no analysis exists yet
   return null;
  }
 }

 async detectAnomalies(jobId: string, timeRange?: string): Promise<AnomalyDetectionResult> {
  return this.request(`/ai/detect-anomalies/${jobId}`, {
   method: 'POST',
   body: JSON.stringify({ timeRange }),
  });
 }

 async suggestSchedule(jobId: string): Promise<PredictiveScheduleResult> {
  return this.request(`/ai/suggest-schedule/${jobId}`);
 }

 async getRetryStrategy(jobId: string, error?: string): Promise<SmartRetryResult> {
  return this.request(`/ai/retry-strategy/${jobId}`, {
   method: 'POST',
   body: JSON.stringify({ error }),
  });
 }

 async optimizePerformance(jobId: string): Promise<PerformanceOptimizationResult> {
  return this.request(`/ai/optimize-performance/${jobId}`);
 }

 async getAllAIAnalyses(): Promise<{ data: AIAnalysisResult[] }> {
  return this.request('/ai/analyses');
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
