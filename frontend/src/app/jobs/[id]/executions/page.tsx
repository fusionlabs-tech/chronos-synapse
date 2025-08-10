'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Job, JobExecution } from '@/types';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/BackButton';
import { useRealtime } from '@/contexts/PubSubContext';
import {
 formatDateTime,
 formatDuration,
 getStatusColor,
 getStatusIcon,
} from '@/lib/utils';
import {
 Play,
 Pause,
 Edit,
 Clock,
 Calendar,
 Zap,
 Activity,
 Eye,
 CheckCircle,
 XCircle,
 AlertTriangle,
 Minus,
 ChevronLeft,
 ChevronRight,
} from 'lucide-react';

export default function JobExecutionsPage() {
 const params = useParams();
 const router = useRouter();
 const { showToast } = useToast();
 const { recentExecutions } = useRealtime();
 const jobId = params.id as string;

 const [job, setJob] = useState<Job | null>(null);
 const [executions, setExecutions] = useState<JobExecution[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [currentPage, setCurrentPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);
 const [totalExecutions, setTotalExecutions] = useState(0);
 const executionsPerPage = 10;

 useEffect(() => {
  const fetchData = async () => {
   try {
    setLoading(true);

    // Fetch job details and executions
    const [jobData, executionsData] = await Promise.all([
     apiClient.getJob(jobId),
     apiClient.getJobExecutions(jobId, 100), // Get more executions for pagination
    ]);

    setJob(jobData.job);
    console.log('Job data:', jobData);
    console.log('Executions data:', executionsData);

    if (Array.isArray(executionsData)) {
     // Sort executions by startedAt desc (newest first)
     const sortedExecutions = executionsData.sort(
      (a, b) =>
       new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
     );

     setTotalExecutions(sortedExecutions.length);
     setTotalPages(Math.ceil(sortedExecutions.length / executionsPerPage));

     // Apply pagination
     const startIndex = (currentPage - 1) * executionsPerPage;
     const endIndex = startIndex + executionsPerPage;
     const paginatedExecutions = sortedExecutions.slice(startIndex, endIndex);
     setExecutions(paginatedExecutions);
    } else {
     setExecutions([]);
     setTotalExecutions(0);
     setTotalPages(1);
    }
   } catch (err) {
    setError('Failed to load job executions');
    console.error('Failed to fetch job executions:', err);
    showToast('Failed to load job executions', 'error');
   } finally {
    setLoading(false);
   }
  };

  if (jobId) {
   fetchData();
  }
 }, [jobId, showToast, currentPage, executionsPerPage]);

 // Real-time execution updates
 useEffect(() => {
  if (recentExecutions.length > 0) {
   // Filter executions for this specific job
   const jobExecutions = recentExecutions.filter(
    (execution) => execution.jobId === jobId
   );

   if (jobExecutions.length > 0) {
    // Update executions list with new real-time data
    setExecutions((prev) => {
     const updated = [...prev];

     jobExecutions.forEach((newExecution) => {
      const existingIndex = updated.findIndex((e) => e.id === newExecution.id);
      if (existingIndex >= 0) {
       // Update existing execution
       updated[existingIndex] = { ...updated[existingIndex], ...newExecution };
      } else {
       // Add new execution at the beginning
       updated.unshift(newExecution);
      }
     });

     return updated;
    });
   }
  }
 }, [recentExecutions, jobId]);

 if (loading) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='loading-spinner h-12 w-12'></div>
   </div>
  );
 }

 if (error || !job) {
  return (
   <div className='max-w-4xl mx-auto'>
    <div className='text-center py-12'>
     <h2 className='page-header-title mb-4'>Job Not Found</h2>
     <p className='text-neutral-600 mb-8 text-lg'>
      {error || 'The requested job could not be found.'}
     </p>
     <button
      onClick={() => router.push('/jobs')}
      className='btn-primary px-8 py-3'
     >
      Back to Jobs
     </button>
    </div>
   </div>
  );
 }

 return (
  <div className='max-w-7xl mx-auto space-y-8'>
   {/* Page Header */}
   <div className='text-center space-y-2'>
    <div>
     <h1 className='page-header-title'>Job Executions</h1>
     <p className='text-neutral-600 mt-2 text-lg'>
      {job.name} - Execution history and monitoring
     </p>
    </div>
   </div>

   {/* Back Button */}
   <div className='flex justify-start'>
    <BackButton href='/jobs' label='Back to Jobs' />
   </div>

   {/* Job Info Card */}
   <Card className='card-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='text-xl'>Job Information</CardTitle>
    </CardHeader>
    <CardContent>
     <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      <div className='space-y-2'>
       <div className='flex items-center gap-2 text-sm font-medium text-neutral-500'>
        <div className='w-2 h-2 rounded-full bg-accent-green-500'></div>
        Status
       </div>
       <span
        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
         job.enabled ? 'badge-success' : 'badge-warning'
        }`}
       >
        {job.enabled ? 'Active' : 'Disabled'}
       </span>
      </div>

      <div className='space-y-2'>
       <div className='flex items-center gap-2 text-sm font-medium text-neutral-500'>
        <Clock className='h-4 w-4' />
        Schedule
       </div>
       <p className='text-sm text-neutral-900 font-mono bg-neutral-50 px-3 py-1 rounded border'>
        {job.schedule && job.schedule.trim() !== '' ? job.schedule : 'One-time'}
       </p>
      </div>

      <div className='space-y-2'>
       <div className='flex items-center gap-2 text-sm font-medium text-neutral-500'>
        <Calendar className='h-4 w-4' />
        Last Run
       </div>
       <p className='text-sm text-neutral-900'>
        {executions && executions.length > 0 && executions[0].finishedAt
         ? formatDateTime(executions[0].finishedAt)
         : 'Never'}
       </p>
      </div>

      <div className='space-y-2'>
       <div className='flex items-center gap-2 text-sm font-medium text-neutral-500'>
        <Clock className='h-4 w-4' />
        Run Mode
       </div>
       <p className='text-sm text-neutral-900'>
        {job.runMode
         ? job.runMode === 'recurring'
           ? 'Recurring'
           : 'One-time'
         : job.schedule && job.schedule.trim() !== ''
         ? 'Recurring'
         : 'One-time'}
       </p>
      </div>
     </div>

     {job.description && (
      <div className='mt-6 pt-6 border-t border-neutral-200'>
       <div className='text-sm font-medium text-neutral-500 mb-2'>
        Description
       </div>
       <p className='text-sm text-neutral-700'>{job.description}</p>
      </div>
     )}
    </CardContent>
   </Card>

   {/* Action Buttons removed for read-only dashboard */}

   {/* Executions List */}
   <Card className='card-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='text-xl'>
      Execution History ({executions.length})
     </CardTitle>
    </CardHeader>
    <CardContent>
     {executions.length === 0 ? (
      <div className='text-center py-12'>
       <div className='w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4'>
        {/* icon removed */}
       </div>
       <h3 className='text-lg font-medium text-neutral-900 mb-2'>
        No Executions Found
       </h3>
       <p className='text-neutral-600 mb-6'>
        No execution history available for this job yet.
       </p>
       {/* CTA removed in read-only mode */}
      </div>
     ) : (
      <div className='space-y-4'>
       {executions.map((execution) => (
        <div
         key={execution.id}
         className='p-6 bg-neutral-50 rounded-lg border border-neutral-200 hover:shadow-md transition-all duration-200'
        >
         <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 min-w-0'>
           <div className='flex items-center space-x-4'>
            <div
             className={`p-2 rounded-full ${getStatusColor(execution.status)}`}
            >
             {/* status icon visuals removed */}
            </div>
            <div className='min-w-0 flex-1'>
             <h3 className='font-medium text-neutral-900 truncate'>
              Execution {execution.id.slice(0, 8)}
             </h3>
             <p className='text-sm text-neutral-500'>
              Started: {formatDateTime(execution.startedAt)}
             </p>
            </div>
           </div>

           {execution.finishedAt && (
            <div className='mt-3 flex items-center gap-4 text-sm text-neutral-600'>
             <span className='flex items-center gap-1'>
              {formatDuration(execution.duration || 0)}
             </span>
             {execution.exitCode !== undefined && (
              <span className='flex items-center gap-1'>
               <span className='font-mono'>Exit: {execution.exitCode}</span>
              </span>
             )}
            </div>
           )}

           {execution.error && (
            <div className='mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200'>
             <div className='font-medium'>Error occurred</div>
            </div>
           )}
          </div>

          <div className='flex-shrink-0'>
           <Link href={`/jobs/${job.id}/executions/${execution.id}`}>
            <Button variant='outline' size='sm' className='btn-secondary'>
             View Details
            </Button>
           </Link>
          </div>
         </div>
        </div>
       ))}
      </div>
     )}

     {/* Pagination Controls */}
     {totalPages > 1 && (
      <div className='flex items-center justify-between mt-6 pt-6 border-t border-neutral-200'>
       <div className='text-sm text-neutral-600'>
        Showing {(currentPage - 1) * executionsPerPage + 1} to{' '}
        {Math.min(currentPage * executionsPerPage, totalExecutions)} of{' '}
        {totalExecutions} executions
       </div>

       <div className='flex items-center gap-2'>
        <Button
         variant='outline'
         size='sm'
         onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
         disabled={currentPage === 1}
         className='btn-secondary'
        >
         <ChevronLeft className='h-4 w-4' />
         Previous
        </Button>

        <div className='flex items-center gap-1'>
         {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
           pageNum = i + 1;
          } else if (currentPage <= 3) {
           pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
           pageNum = totalPages - 4 + i;
          } else {
           pageNum = currentPage - 2 + i;
          }

          return (
           <Button
            key={pageNum}
            variant={currentPage === pageNum ? 'default' : 'outline'}
            size='sm'
            onClick={() => setCurrentPage(pageNum)}
            className={
             currentPage === pageNum ? 'btn-primary' : 'btn-secondary'
            }
           >
            {pageNum}
           </Button>
          );
         })}
        </div>

        <Button
         variant='outline'
         size='sm'
         onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
         disabled={currentPage === totalPages}
         className='btn-secondary'
        >
         Next
         <ChevronRight className='h-4 w-4' />
        </Button>
       </div>
      </div>
     )}
    </CardContent>
   </Card>
  </div>
 );
}
