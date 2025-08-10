'use client';

import {
 createContext,
 useContext,
 ReactNode,
 useState,
 useEffect,
 useCallback,
} from 'react';
import { usePubSub as usePubSubHook } from '@/hooks/usePubSub';
import { useToast } from '@/components/ui/toasts';
import { apiClient } from '@/lib/api';
import { DashboardStats, Job, JobExecution } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface PubSubContextType {
 // Connection state
 pubSubConnected: boolean;
 pubSubConnecting: boolean;
 pubSubError: string | null;

 // Real-time data
 dashboardStats: DashboardStats | null;
 jobs: Job[];
 recentExecutions: JobExecution[];
 systemHealth: any;

 // Actions
 refreshDashboardStats: () => Promise<void>;
 refreshJobs: () => Promise<void>;
 refreshSystemHealth: () => Promise<void>;

 // Pub/Sub connection management
 reconnectPubSub: () => void;
}

const PubSubContext = createContext<PubSubContextType | undefined>(undefined);

export function PubSubProvider({ children }: { children: ReactNode }) {
 const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
  null
 );
 const [jobs, setJobs] = useState<Job[]>([]);
 const [recentExecutions, setRecentExecutions] = useState<JobExecution[]>([]);
 const [systemHealth, setSystemHealth] = useState<any>(null);
 const { showToast } = useToast();
 const { user, token } = useAuth();

 // Pub/Sub connection for all real-time updates (only when authenticated)
 const {
  connected: wsConnected,
  connecting: wsConnecting,
  error: wsError,
  connect: reconnectWS,
 } = usePubSubHook(
  {
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

    // Always refresh dashboard stats when job execution events occur
    refreshDashboardStats();
   },

   onJobStatus: (data: Record<string, unknown>) => {
    // Handle real-time job status updates
    if (data.type === 'job_created' && (data.data as any)?.job) {
     // Add new job to the list (sorted by createdAt desc)
     setJobs((prev) => {
      const newJob = (data.data as any).job as Job;
      const updatedJobs = [newJob, ...prev];
      return updatedJobs.sort(
       (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
     });

     // Refresh dashboard stats when a job is created
     refreshDashboardStats();
    } else if (data.type === 'job_updated' && (data.data as any)?.job) {
     // Update existing job in the list
     setJobs((prev) =>
      prev.map((job) =>
       job.id === (data.data as any).jobId
        ? { ...job, ...((data.data as any).job as Partial<Job>) }
        : job
      )
     );

     // Refresh dashboard stats when a job is updated
     refreshDashboardStats();
    } else if (data.type === 'job_deleted' && (data.data as any)?.jobId) {
     // Remove job from the list
     setJobs((prev) =>
      prev.filter((job) => job.id !== (data.data as any).jobId)
     );

     // Refresh dashboard stats when a job is deleted
     refreshDashboardStats();
    } else if (data.jobId && data.status) {
     // Handle job status updates (for executions)
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
     // Also refresh dashboard stats when jobs are updated
     refreshDashboardStats();
    } else if (data.type === 'system_update') {
     // Refresh system health when notified
     refreshSystemHealth();
    } else if (data.type === 'execution_update') {
     // Refresh dashboard stats when executions are updated
     refreshDashboardStats();
    }
   },

   autoReconnect: true,
   reconnectInterval: 5000,
  },
  !!user && !!token
 ); // Only connect when user is authenticated

 // Initial data fetch functions
 const refreshDashboardStats = useCallback(async () => {
  try {
   const stats = await apiClient.getDashboardStats(1);
   setDashboardStats(stats);
  } catch (error) {
   console.error('Failed to fetch dashboard stats:', error);
  }
 }, []);

 const refreshJobs = useCallback(async () => {
  try {
   const response = await apiClient.getJobs();
   const sortedJobs = (response.jobs || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
   );
   setJobs(sortedJobs);
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

 const value: PubSubContextType = {
  // Connection state
  pubSubConnected: wsConnected,
  pubSubConnecting: wsConnecting,
  pubSubError: wsError,

  // Real-time data
  dashboardStats,
  jobs,
  recentExecutions,
  systemHealth,

  // Actions
  refreshDashboardStats,
  refreshJobs,
  refreshSystemHealth,

  // Pub/Sub connection management
  reconnectPubSub: reconnectWS,
 };

 return (
  <PubSubContext.Provider value={value}>{children}</PubSubContext.Provider>
 );
}

export function useRealtime() {
 const context = useContext(PubSubContext);
 if (context === undefined) {
  throw new Error('useRealtime must be used within a PubSubProvider');
 }
 return context;
}
