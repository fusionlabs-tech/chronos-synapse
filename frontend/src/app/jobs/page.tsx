'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { Job } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { useRealtime } from '@/contexts/RealtimeContext';
import {
 Plus,
 Search,
 Grid,
 List,
 Play,
 Pause,
 Edit,
 Trash2,
 MoreVertical,
 Calendar,
 Clock,
 CheckCircle,
 AlertTriangle,
 Eye,
 Settings,
 Filter,
} from 'lucide-react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default function JobsPage() {
 const router = useRouter();
 const { jobs, sseConnected, refreshJobs } = useRealtime();
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
 const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);
 const [openDropdown, setOpenDropdown] = useState<string | null>(null);
 const { showToast } = useToast();

 // Close dropdown when clicking outside
 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   const target = event.target as Element;
   if (!target.closest('.dropdown-container')) {
    setOpenDropdown(null);
   }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 // Set loading based on data availability
 useEffect(() => {
  if (jobs.length > 0) {
   setLoading(false);
  }
 }, [jobs]);

 // Set a timeout to stop loading even if data doesn't come
 useEffect(() => {
  const timeout = setTimeout(() => {
   setLoading(false);
  }, 5000); // 5 second timeout

  return () => clearTimeout(timeout);
 }, []);

 const handleToggleJob = async (jobId: string, enabled: boolean) => {
  try {
   await apiClient.updateJob(jobId, { enabled });
   // Job update will be handled by WebSocket real-time updates
   showToast(`Job ${enabled ? 'enabled' : 'disabled'} successfully`, 'success');
  } catch (error) {
   console.error('Failed to toggle job:', error);
   showToast('Failed to update job status', 'error');
  }
 };

 const handleDeleteJob = async (jobId: string) => {
  if (
   !confirm(
    'Are you sure you want to delete this job? This action cannot be undone.'
   )
  ) {
   return;
  }

  try {
   await apiClient.deleteJob(jobId);
   // Job deletion will be handled by WebSocket real-time updates
   showToast('Job deleted successfully', 'success');
  } catch (error) {
   console.error('Failed to delete job:', error);
   showToast('Failed to delete job', 'error');
  }
 };

 const toggleDropdown = (jobId: string) => {
  setOpenDropdown(openDropdown === jobId ? null : jobId);
 };

 const filteredJobs = jobs.filter((job) => {
  const matchesSearch =
   job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
   job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
   job.schedule.toLowerCase().includes(searchQuery.toLowerCase()) ||
   job.tags.some((tag) =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
   );

  // Convert job.enabled to boolean to handle both string and boolean values
  const jobEnabled = Boolean(job.enabled);
  const matchesFilter = filterEnabled === null || jobEnabled === filterEnabled;

  return matchesSearch && matchesFilter;
 });

 const getJobTypeIcon = (command: string) => {
  const cmd = command.toLowerCase();
  if (cmd.includes('backup') || cmd.includes('dump')) return '💾';
  if (cmd.includes('clean') || cmd.includes('cleanup')) return '🧹';
  if (cmd.includes('health') || cmd.includes('check')) return '📊';
  if (cmd.includes('sync') || cmd.includes('rsync')) return '🔄';
  if (cmd.includes('curl') || cmd.includes('wget')) return '🌐';
  if (cmd.includes('report') || cmd.includes('report')) return '📋';
  return '⚙️';
 };

 if (loading) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='loading-spinner h-12 w-12'></div>
   </div>
  );
 }

 return (
  <div className='max-w-7xl mx-auto space-y-8'>
   {/* Page Header */}
   <div className='text-center space-y-4'>
    <div className='page-header-icon'>
     <Settings className='h-10 w-10 text-white' />
    </div>
    <div>
     <h1 className='page-header-title'>Job Management</h1>
     <p className='text-neutral-600 mt-2 text-lg'>
      Create, monitor, and manage your cron jobs
     </p>
    </div>
   </div>

   {/* Controls */}
   <Card className='card-primary'>
    <CardContent className='p-6'>
     <div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
      {/* Search and Filters */}
      <div className='flex flex-col sm:flex-row gap-4 flex-1 w-full'>
       <div className='relative flex-1 max-w-md'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
        <Input
         placeholder='Search jobs...'
         value={searchQuery}
         onChange={(e) => setSearchQuery(e.target.value)}
         className='input-primary pl-10'
        />
       </div>

       <div className='flex gap-2'>
        <Button
         variant={filterEnabled === null ? 'default' : 'outline'}
         size='sm'
         onClick={() => setFilterEnabled(null)}
         className={filterEnabled === null ? 'btn-primary' : 'btn-secondary'}
        >
         All
        </Button>
        <Button
         variant={filterEnabled === true ? 'default' : 'outline'}
         size='sm'
         onClick={() => setFilterEnabled(true)}
         className={filterEnabled === true ? 'btn-success' : 'btn-secondary'}
        >
         Active
        </Button>
        <Button
         variant={filterEnabled === false ? 'default' : 'outline'}
         size='sm'
         onClick={() => setFilterEnabled(false)}
         className={filterEnabled === false ? 'btn-secondary' : 'btn-secondary'}
        >
         Disabled
        </Button>
       </div>
      </div>

      {/* View Toggle and Create Button */}
      <div className='flex items-center gap-4'>
       <div className='flex border border-neutral-200 rounded-lg'>
        <Button
         variant={viewMode === 'list' ? 'default' : 'ghost'}
         size='sm'
         onClick={() => setViewMode('list')}
         className={
          viewMode === 'list'
           ? 'btn-primary rounded-r-none'
           : 'btn-secondary rounded-r-none'
         }
        >
         <List className='h-4 w-4' />
        </Button>
        <Button
         variant={viewMode === 'grid' ? 'default' : 'ghost'}
         size='sm'
         onClick={() => setViewMode('grid')}
         className={
          viewMode === 'grid'
           ? 'btn-primary rounded-l-none'
           : 'btn-secondary rounded-l-none'
         }
        >
         <Grid className='h-4 w-4' />
        </Button>
       </div>

       <Link href='/jobs/new'>
        <Button className='btn-primary py-2 px-4 flex items-center gap-2'>
         <Plus className='h-4 w-4' />
         Create Job
        </Button>
       </Link>
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Jobs List/Grid */}
   {filteredJobs.length === 0 ? (
    <Card className='card-primary'>
     <CardContent className='p-12 text-center'>
      <div className='w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4'>
       <Settings className='h-8 w-8 text-neutral-400' />
      </div>
      <h3 className='text-lg font-medium text-neutral-900 mb-2'>
       No jobs found
      </h3>
      <p className='text-neutral-600 mb-6'>
       {searchQuery || filterEnabled !== null
        ? 'Try adjusting your search or filters'
        : 'Create your first job to get started'}
      </p>
      <Link href='/jobs/new'>
       <Button className='btn-primary py-2 px-6 flex items-center gap-2'>
        <Plus className='h-4 w-4' />
        Create Your First Job
       </Button>
      </Link>
     </CardContent>
    </Card>
   ) : (
    <div
     className={
      viewMode === 'grid'
       ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative'
       : 'space-y-4 relative'
     }
    >
     {filteredJobs.map((job) => (
      <Card
       key={job.id}
       data-job-id={job.id}
       className='card-primary hover:shadow-xl transition-all duration-200 relative'
      >
       <CardContent className='p-6'>
        {viewMode === 'grid' ? (
         // Grid View
         <div className='space-y-4'>
          <div className='flex items-start justify-between'>
           <div className='flex items-center gap-3'>
            <span className='text-2xl'>{getJobTypeIcon(job.command)}</span>
            <div>
             <h3 className='font-semibold text-neutral-900 truncate'>
              {job.name}
             </h3>
             <p className='text-sm text-neutral-600 truncate'>{job.schedule}</p>
            </div>
           </div>
           <div className='flex items-center gap-2'>
            <span
             className={`px-2 py-1 text-xs rounded-full font-medium ${
              job.enabled ? 'badge-success' : 'badge-warning'
             }`}
            >
             {job.enabled ? 'Active' : 'Disabled'}
            </span>
           </div>
          </div>

          {job.description && (
           <p className='text-sm text-neutral-600 line-clamp-2'>
            {job.description}
           </p>
          )}

          {job.tags.length > 0 && (
           <div className='flex flex-wrap gap-1'>
            {job.tags.slice(0, 3).map((tag, index) => (
             <span
              key={index}
              className='px-2 py-1 bg-accent-blue-100 text-accent-blue-800 text-xs rounded-full'
             >
              {tag}
             </span>
            ))}
            {job.tags.length > 3 && (
             <span className='px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full'>
              +{job.tags.length - 3}
             </span>
            )}
           </div>
          )}

          <div className='flex items-center justify-between pt-4 border-t border-neutral-100'>
           <div className='flex items-center gap-4 text-sm text-neutral-500'>
            <span className='flex items-center gap-1'>
             <Clock className='h-3 w-3' />
             {job.timeout}ms
            </span>
            <span className='flex items-center gap-1'>
             <Calendar className='h-3 w-3' />
             {job.retries}
            </span>
           </div>

           <div className='flex items-center gap-2'>
            <Button
             variant='outline'
             size='sm'
             onClick={() => handleToggleJob(job.id, !job.enabled)}
             className='btn-secondary'
            >
             {job.enabled ? (
              <Pause className='h-3 w-3' />
             ) : (
              <Play className='h-3 w-3' />
             )}
            </Button>

            <div className='relative dropdown-container'>
             <Button
              variant='outline'
              size='sm'
              className='btn-secondary'
              onClick={() => toggleDropdown(job.id)}
             >
              <MoreVertical className='h-3 w-3' />
             </Button>

             {/* Inline dropdown for grid view */}
             {openDropdown === job.id && (
              <div className='absolute top-full right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl py-1 z-[9999] min-w-[120px]'>
               <button
                className='w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2'
                onClick={() => {
                 setOpenDropdown(null);
                 window.location.href = `/jobs/${job.id}/edit`;
                }}
               >
                <Edit className='h-3 w-3' />
                Edit
               </button>
               <button
                className='w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2'
                onClick={() => {
                 setOpenDropdown(null);
                 window.location.href = `/jobs/${job.id}/executions`;
                }}
               >
                <Eye className='h-3 w-3' />
                Executions
               </button>
               <button
                onClick={() => {
                 handleDeleteJob(job.id);
                 setOpenDropdown(null);
                }}
                className='w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2'
               >
                <Trash2 className='h-3 w-3' />
                Delete
               </button>
              </div>
             )}
            </div>
           </div>
          </div>
         </div>
        ) : (
         // List View
         <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4 flex-1'>
           <span className='text-2xl'>{getJobTypeIcon(job.command)}</span>

           <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-3 mb-1'>
             <h3 className='font-semibold text-neutral-900 truncate'>
              {job.name}
             </h3>
             <span
              className={`px-2 py-1 text-xs rounded-full font-medium ${
               job.enabled ? 'badge-success' : 'badge-warning'
              }`}
             >
              {job.enabled ? 'Active' : 'Disabled'}
             </span>
            </div>

            {job.description && (
             <p className='text-sm text-neutral-600 truncate'>
              {job.description}
             </p>
            )}

            <div className='flex items-center gap-4 mt-2 text-sm text-neutral-500'>
             <span className='flex items-center gap-1'>
              <Calendar className='h-3 w-3' />
              {job.schedule}
             </span>
             <span className='flex items-center gap-1'>
              <Clock className='h-3 w-3' />
              {job.timeout}ms
             </span>
             <span className='flex items-center gap-1'>
              <CheckCircle className='h-3 w-3' />
              {job.retries} retries
             </span>
            </div>
           </div>
          </div>

          <div className='flex items-center gap-2'>
           {job.tags.length > 0 && (
            <div className='flex gap-1'>
             {job.tags.slice(0, 2).map((tag, index) => (
              <span
               key={index}
               className='px-2 py-1 bg-accent-blue-100 text-accent-blue-800 text-xs rounded-full'
              >
               {tag}
              </span>
             ))}
             {job.tags.length > 2 && (
              <span className='px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full'>
               +{job.tags.length - 2}
              </span>
             )}
            </div>
           )}

           <Button
            variant='outline'
            size='sm'
            onClick={() => handleToggleJob(job.id, !job.enabled)}
            className='btn-secondary'
           >
            {job.enabled ? (
             <Pause className='h-3 w-3' />
            ) : (
             <Play className='h-3 w-3' />
            )}
           </Button>

           <Link href={`/jobs/${job.id}/edit`}>
            <Button variant='outline' size='sm' className='btn-secondary'>
             <Edit className='h-3 w-3' />
            </Button>
           </Link>

           <Link href={`/jobs/${job.id}/executions`}>
            <Button variant='outline' size='sm' className='btn-secondary'>
             <Eye className='h-3 w-3' />
            </Button>
           </Link>

           <Button
            variant='outline'
            size='sm'
            onClick={() => handleDeleteJob(job.id)}
            className='btn-danger'
           >
            <Trash2 className='h-3 w-3' />
           </Button>
          </div>
         </div>
        )}
       </CardContent>
      </Card>
     ))}
    </div>
   )}
  </div>
 );
}
