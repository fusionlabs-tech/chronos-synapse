'use client';

import {
 createContext,
 useContext,
 ReactNode,
 useState,
 useEffect,
 useCallback,
} from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api';
import { DashboardStats, Job, JobExecution } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface RealtimeContextType {
 // Connection state
 sseConnected: boolean;
 sseConnecting: boolean;
 sseError: string | null;

 // Real-time data
 dashboardStats: DashboardStats | null;
 jobs: Job[];
 recentExecutions: JobExecution[];
 systemHealth: any;

 // Actions
 refreshDashboardStats: () => Promise<void>;
 refreshJobs: () => Promise<void>;
 refreshSystemHealth: () => Promise<void>;

 // SSE connection management
 reconnectSSE: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
 undefined
);

export function RealtimeProvider({ children }: { children: ReactNode }) {
 const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
  null
 );
 const [jobs, setJobs] = useState<Job[]>([]);
 const [recentExecutions, setRecentExecutions] = useState<JobExecution[]>([]);
 const [systemHealth, setSystemHealth] = useState<any>(null);
 const { showToast } = useToast();
 const { user, token } = useAuth();

 // WebSocket connection for all real-time updates
 const {
  connected: wsConnected,
  connecting: wsConnecting,
  error: wsError,
  connect: reconnectWS,
 } = useWebSocket({
  onJobExecution: (data) => {
   // Handle real-time job execution updates
   if (data.execution) {
    setRecentExecutions((prev) => {
     const newExecutions = [data.execution as JobExecution, ...prev];
     return newExecutions.slice(0, 10); // Keep only last 10
    });
   }

   // Update dashboard stats if execution affects them
   if (data.stats && typeof data.stats === 'object') {
    setDashboardStats((prev) =>
     prev ? { ...prev, ...(data.stats as Record<string, unknown>) } : null
    );
   }
  },

  onJobStatus: (data) => {
   // Handle real-time job status updates
   if (data.jobId && data.status) {
    setJobs((prev) =>
     prev.map((job) =>
      job.id === data.jobId
       ? {
          ...job,
          status: data.status as string,
          lastRun: data.lastRun as string | undefined,
          nextRun: data.nextRun as string | undefined,
         }
       : job
     )
    );
   }
  },

  onSystemMetrics: (data) => {
   // Handle real-time system metrics updates
   if (data.metrics && typeof data.metrics === 'object') {
    setSystemHealth((prev: any) => ({
     ...prev,
     ...(data.metrics as Record<string, unknown>),
    }));
   }

   // Update dashboard stats if metrics affect them
   if (data.dashboardStats && typeof data.dashboardStats === 'object') {
    setDashboardStats((prev) =>
     prev
      ? { ...prev, ...(data.dashboardStats as Record<string, unknown>) }
      : null
    );
   }
  },

  onNotification: (data) => {
   // Handle real-time notification updates
   if (data.type === 'dashboard_update') {
    // Refresh dashboard data when notified
    refreshDashboardStats();
   } else if (data.type === 'jobs_update') {
    // Refresh jobs data when notified
    refreshJobs();
   } else if (data.type === 'system_update') {
    // Refresh system health when notified
    refreshSystemHealth();
   }
  },

  autoReconnect: true,
  reconnectInterval: 5000,
 });

 // Initial data fetch functions
 const refreshDashboardStats = useCallback(async () => {
  try {
   const stats = await apiClient.getDashboardStats();
   setDashboardStats(stats);
  } catch (error) {
   console.error('Failed to fetch dashboard stats:', error);
  }
 }, []);

 const refreshJobs = useCallback(async () => {
  try {
   const response = await apiClient.getJobs();
   setJobs(response.jobs || []);
  } catch (error) {
   console.error('Failed to fetch jobs:', error);
  }
 }, []);

 const refreshSystemHealth = useCallback(async () => {
  try {
   const health = await apiClient.getSystemHealth();
   setSystemHealth(health);
  } catch (error) {
   console.error('Failed to fetch system health:', error);
  }
 }, []);

 // Initial data fetch on mount - fetch data when authenticated, regardless of WebSocket
 useEffect(() => {
  if (user && token) {
   refreshDashboardStats();
   refreshJobs();
   refreshSystemHealth();
  }
 }, [user, token, refreshDashboardStats, refreshJobs, refreshSystemHealth]);

 // Connection status is now handled by UI indicators instead of toasts

 const value: RealtimeContextType = {
  // Connection state
  sseConnected: wsConnected,
  sseConnecting: wsConnecting,
  sseError: wsError,

  // Real-time data
  dashboardStats,
  jobs,
  recentExecutions,
  systemHealth,

  // Actions
  refreshDashboardStats,
  refreshJobs,
  refreshSystemHealth,

  // WebSocket connection management
  reconnectSSE: reconnectWS,
 };

 return (
  <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
 );
}

export function useRealtime() {
 const context = useContext(RealtimeContext);
 if (context === undefined) {
  throw new Error('useRealtime must be used within a RealtimeProvider');
 }
 return context;
}
