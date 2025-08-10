'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { JobExecution } from '@/types';
import {
 formatDateTime,
 formatDuration,
 formatRelativeTime,
} from '@/lib/utils';
import { usePubSub } from '@/hooks/usePubSub';
import BackButton from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function JobExecutionPage() {
 const params = useParams();
 const jobId = decodeURIComponent(params.id as string);
 const rawExecutionId = params.executionId as string;
 const executionId = decodeURIComponent(rawExecutionId);

 const [execution, setExecution] = useState<JobExecution | null>(null);
 const [logs, setLogs] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 // WebSocket connection for real-time logs (only when authenticated)
 const { connected } = usePubSub(
  {
   onJobExecution: (data: Record<string, unknown>) => {
    if (data.executionId === executionId && data.type === 'log') {
     setLogs((prev) => [...prev, data]);
    }
   },
  },
  true
 ); // Always connect on this page since user must be authenticated to access it

 useEffect(() => {
  const fetchExecutionData = async () => {
   try {
    setLoading(true);

    // Fetch execution details
    const executionData = await apiClient.getExecution(jobId, executionId);
    setExecution(executionData);
    // Prefer inline stdout/stderr if present
    const inlineLogs: any[] = [];
    if ((executionData as any)?.stdout) {
     inlineLogs.push({
      stream: 'stdout',
      output: (executionData as any).stdout,
      timestamp: Date.now(),
     });
    }
    if ((executionData as any)?.stderr) {
     inlineLogs.push({
      stream: 'stderr',
      output: (executionData as any).stderr,
      timestamp: Date.now(),
     });
    }
    setLogs(inlineLogs);
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
  <div className='max-w-7xl mx-auto space-y-8'>
   {/* Page Header (centered like list page) */}
   <div className='text-center space-y-2'>
    <div>
     <h1 className='page-header-title text-3xl'>Job Execution Details</h1>
     <p className='text-neutral-600 mt-1 font-mono break-all'>{executionId}</p>
    </div>
   </div>

   {/* Controls Row */}
   <div className='flex items-center justify-between'>
    <BackButton
     href={`/jobs/${encodeURIComponent(jobId)}/executions`}
     label='Back to Executions'
    />
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

   {/* Summary */}
   <Card className='card-primary'>
    <CardContent className='p-6'>
     {execution && (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
       <div>
        <div className='text-sm font-medium text-neutral-500 mb-1'>Status</div>
        <Badge
         variant={
          execution.status === 'success'
           ? 'green'
           : execution.status === 'failed'
           ? 'red'
           : execution.status === 'running'
           ? 'secondary'
           : 'gray'
         }
        >
         {execution.status}
        </Badge>
       </div>
       <div>
        <div className='text-sm font-medium text-neutral-500 mb-1'>Started</div>
        <div className='text-sm text-neutral-900'>
         {formatDateTime(execution.startedAt)}
        </div>
        <div className='text-xs text-neutral-500'>
         {formatRelativeTime(execution.startedAt)}
        </div>
       </div>
       <div>
        <div className='text-sm font-medium text-neutral-500 mb-1'>
         Finished
        </div>
        <div className='text-sm text-neutral-900'>
         {execution.finishedAt ? formatDateTime(execution.finishedAt) : '-'}
        </div>
        {execution.finishedAt && (
         <div className='text-xs text-neutral-500'>
          {formatRelativeTime(execution.finishedAt)}
         </div>
        )}
       </div>
       <div>
        <div className='text-sm font-medium text-neutral-500 mb-1'>
         Duration
        </div>
        <div className='text-sm text-neutral-900'>
         {execution.duration ? formatDuration(execution.duration) : '-'}
        </div>
       </div>
       {execution.exitCode !== undefined && (
        <div>
         <div className='text-sm font-medium text-neutral-500 mb-1'>
          Exit Code
         </div>
         <div className='text-sm text-neutral-900 font-mono'>
          {execution.exitCode}
         </div>
        </div>
       )}
      </div>
     )}
     {execution?.error && (
      <div className='mt-6 text-sm text-accent-red-700 bg-accent-red-50 border border-accent-red-200 rounded p-3'>
       {execution.error}
      </div>
     )}
    </CardContent>
   </Card>

   {/* Logs & Output */}
   <Card className='card-primary'>
    <CardHeader className='pb-2'>
     <CardTitle className='text-lg font-semibold text-neutral-900'>
      Logs
     </CardTitle>
     <p className='text-sm text-neutral-600 mt-1'>
      Inline command output captured by the SDK
     </p>
    </CardHeader>
    <CardContent>
     <Tabs
      defaultValue={
       logs.length > 0 && logs.some((l) => l.stream === 'stderr')
        ? 'stderr'
        : 'stdout'
      }
     >
      <TabsList>
       <TabsTrigger value='stdout'>Stdout</TabsTrigger>
       <TabsTrigger value='stderr'>Stderr</TabsTrigger>
      </TabsList>
      <TabsContent value='stdout'>
       {(() => {
        const out = logs.filter((l) => l.stream !== 'stderr');
        if (out.length === 0)
         return (
          <div className='text-neutral-500 text-sm py-6'>
           No stdout available…
          </div>
         );
        return (
         <div className='max-h-[480px] overflow-auto border rounded bg-neutral-50'>
          {out.map((log, idx) => (
           <div
            key={idx}
            className='px-4 py-2 text-sm font-mono border-b last:border-b-0 border-neutral-200'
           >
            <span className='text-neutral-400 pr-3'>
             {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className='text-neutral-800 whitespace-pre-wrap break-words'>
             {log.output}
            </span>
           </div>
          ))}
         </div>
        );
       })()}
      </TabsContent>
      <TabsContent value='stderr'>
       {(() => {
        const err = logs.filter((l) => l.stream === 'stderr');
        if (err.length === 0)
         return (
          <div className='text-neutral-500 text-sm py-6'>
           No stderr available…
          </div>
         );
        return (
         <div className='max-h-[480px] overflow-auto border rounded bg-accent-red-50'>
          {err.map((log, idx) => (
           <div
            key={idx}
            className='px-4 py-2 text-sm font-mono border-b last:border-b-0 border-accent-red-200 text-accent-red-800'
           >
            <span className='text-accent-red-400 pr-3'>
             {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className='whitespace-pre-wrap break-words'>
             {log.output}
            </span>
           </div>
          ))}
         </div>
        );
       })()}
      </TabsContent>
     </Tabs>
    </CardContent>
   </Card>

   {/* Code Snippet */}
   {Boolean((execution as any)?.codeSnippet) && (
    <Card className='card-primary'>
     <CardHeader className='pb-2'>
      <CardTitle className='text-lg font-semibold text-neutral-900'>
       Code Snippet
      </CardTitle>
      <p className='text-sm text-neutral-600 mt-1'>
       Captured from the failing context
       {(execution as any)?.codeLanguage
        ? ` (${(execution as any).codeLanguage})`
        : ''}
      </p>
     </CardHeader>
     <CardContent>
      <div className='max-h-[480px] overflow-auto border rounded bg-neutral-50'>
       <pre className='p-4 text-sm font-mono whitespace-pre-wrap break-words text-neutral-900'>
        {String((execution as any).codeSnippet)}
       </pre>
      </div>
     </CardContent>
    </Card>
   )}
  </div>
 );
}
