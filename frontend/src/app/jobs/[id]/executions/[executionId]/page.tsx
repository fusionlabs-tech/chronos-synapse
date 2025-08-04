'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { JobExecution } from '@/types';
import { formatDateTime, formatDuration } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';
import BackButton from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function JobExecutionPage() {
 const params = useParams();
 const jobId = params.id as string;
 const executionId = params.executionId as string;

 const [execution, setExecution] = useState<JobExecution | null>(null);
 const [logs, setLogs] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 // WebSocket connection for real-time logs
 const { connected } = useWebSocket({
  onJobExecution: (data: Record<string, unknown>) => {
   if (data.executionId === executionId && data.type === 'log') {
    setLogs((prev) => [...prev, data]);
   }
  },
 });

 useEffect(() => {
  const fetchExecutionData = async () => {
   try {
    setLoading(true);

    // Fetch execution details
    const executionData = await apiClient.getExecution(jobId, executionId);
    setExecution(executionData);

    // Fetch logs
    const logsData = await apiClient.getExecutionLogs(jobId, executionId);
    setLogs(logsData.logs || []);
   } catch (err) {
    setError('Failed to load execution data');
    console.error('Failed to fetch execution:', err);
   } finally {
    setLoading(false);
   }
  };

  if (executionId) {
   fetchExecutionData();
  }
 }, [executionId, jobId]);

 if (loading) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='loading-spinner h-12 w-12'></div>
   </div>
  );
 }

 if (error || !execution) {
  return (
   <div className='text-center py-12'>
    <h2 className='text-2xl font-bold text-neutral-900 mb-4'>
     Execution Not Found
    </h2>
    <p className='text-neutral-600 mb-6'>
     {error || 'The requested execution could not be found.'}
    </p>
    <button
     onClick={() => window.history.back()}
     className='btn-primary px-6 py-2'
    >
     Go Back
    </button>
   </div>
  );
 }

 const getStatusColor = (status: string) => {
  switch (status) {
   case 'running':
    return 'text-accent-blue-600 bg-accent-blue-50';
   case 'success':
    return 'text-accent-green-600 bg-accent-green-50';
   case 'failed':
    return 'text-accent-red-600 bg-accent-red-50';
   case 'timeout':
    return 'text-accent-orange-600 bg-accent-orange-50';
   case 'cancelled':
    return 'text-neutral-600 bg-neutral-50';
   default:
    return 'text-neutral-600 bg-neutral-50';
  }
 };

 return (
  <div className='space-y-6'>
   {/* Page Header */}
   <div className='flex items-center justify-between'>
    <div className='flex items-center gap-6'>
     <BackButton
      href={`/jobs/${jobId}/executions`}
      label='Back to Executions'
     />
     <div>
      <h1 className='page-header-title text-3xl'>Job Execution Details</h1>
      <p className='text-neutral-600 mt-1'>Execution ID: {executionId}</p>
     </div>
    </div>

    {/* Connection Status */}
    <div className='flex items-center space-x-2'>
     <div
      className={`w-2 h-2 rounded-full ${
       connected ? 'bg-accent-green-500 animate-pulse' : 'bg-accent-red-500'
      }`}
     ></div>
     <span className='text-sm text-neutral-600'>
      {connected ? 'Live Updates' : 'Disconnected'}
     </span>
    </div>
   </div>

   {/* Execution Info */}
   <Card className='card-primary'>
    <CardContent className='p-6'>
     <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div>
       <h3 className='text-sm font-medium text-neutral-500'>Status</h3>
       <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
         execution.status
        )}`}
       >
        {execution.status}
       </span>
      </div>

      <div>
       <h3 className='text-sm font-medium text-neutral-500'>Started At</h3>
       <p className='text-sm text-neutral-900'>
        {formatDateTime(execution.startedAt)}
       </p>
      </div>

      {execution.finishedAt && (
       <div>
        <h3 className='text-sm font-medium text-neutral-500'>Finished At</h3>
        <p className='text-sm text-neutral-900'>
         {formatDateTime(execution.finishedAt)}
        </p>
       </div>
      )}

      {execution.duration && (
       <div>
        <h3 className='text-sm font-medium text-neutral-500'>Duration</h3>
        <p className='text-sm text-neutral-900'>
         {formatDuration(execution.duration)}
        </p>
       </div>
      )}

      {execution.exitCode !== undefined && (
       <div>
        <h3 className='text-sm font-medium text-neutral-500'>Exit Code</h3>
        <p className='text-sm text-neutral-900'>{execution.exitCode}</p>
       </div>
      )}
     </div>

     {execution.error && (
      <div className='mt-4'>
       <h3 className='text-sm font-medium text-neutral-500'>Error</h3>
       <p className='text-sm text-accent-red-600 bg-accent-red-50 p-3 rounded-md mt-1'>
        {execution.error}
       </p>
      </div>
     )}
    </CardContent>
   </Card>

   {/* Real-time Logs */}
   <Card className='card-primary'>
    <CardHeader className='pb-4'>
     <CardTitle className='text-lg font-semibold text-neutral-900'>
      Execution Logs
     </CardTitle>
     <p className='text-sm text-neutral-600 mt-1'>
      Real-time command output and logs
     </p>
    </CardHeader>
    <CardContent className='p-6'>
     {logs.length === 0 ? (
      <div className='text-center py-8 text-neutral-500'>
       <p>No logs available yet...</p>
      </div>
     ) : (
      <div className='space-y-2 max-h-96 overflow-y-auto'>
       {logs.map((log, index) => (
        <div
         key={index}
         className={`p-3 rounded-md text-sm font-mono ${
          log.stream === 'stderr'
           ? 'bg-accent-red-50 text-accent-red-800 border border-accent-red-200'
           : 'bg-neutral-50 text-neutral-800 border border-neutral-200'
         }`}
        >
         <div className='flex items-center justify-between mb-1'>
          <span className='text-xs font-medium uppercase'>
           {log.stream === 'stderr' ? 'ERROR' : 'OUTPUT'}
          </span>
          <span className='text-xs text-neutral-500'>
           {new Date(log.timestamp).toLocaleTimeString()}
          </span>
         </div>
         <pre className='whitespace-pre-wrap break-words'>{log.output}</pre>
        </div>
       ))}
      </div>
     )}
    </CardContent>
   </Card>
  </div>
 );
}
