'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useRealtime } from '@/contexts/PubSubContext';
import { Search, Grid, List } from 'lucide-react';

export default function JobsPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const pathname = usePathname();
 const { jobs, recentExecutions } = useRealtime();
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
 const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);
 const [recentList, setRecentList] = useState<typeof recentExecutions>([]);

 useEffect(() => {
  if (jobs.length > 0) setLoading(false);
 }, [jobs]);

 useEffect(() => {
  const timeout = setTimeout(() => setLoading(false), 5000);
  return () => clearTimeout(timeout);
 }, []);

 // Initialize filter from URL (?enabled=true|false)
 useEffect(() => {
  const enabledParam = searchParams.get('enabled');
  if (enabledParam === 'true') setFilterEnabled(true);
  else if (enabledParam === 'false') setFilterEnabled(false);
  else if (enabledParam === 'all' || enabledParam === null)
   setFilterEnabled(null);
 }, [searchParams]);

 const updateEnabledFilter = (value: 'true' | 'false' | 'all') => {
  const params = new URLSearchParams(Array.from(searchParams.entries()));
  if (value === 'all') params.delete('enabled');
  else params.set('enabled', value);
  // Push new URL and update state for immediate UI response
  router.push(`${pathname}?${params.toString()}`);
  if (value === 'true') setFilterEnabled(true);
  else if (value === 'false') setFilterEnabled(false);
  else setFilterEnabled(null);
 };

 // Ensure we have recent executions for last-run calculation
 useEffect(() => {
  const load = async () => {
   try {
    if (recentExecutions.length > 0) {
     setRecentList(recentExecutions);
    } else {
     const data = await apiClient.getRecentExecutions(30, 100);
     setRecentList(data);
    }
   } catch {
    setRecentList([]);
   }
  };
  void load();
 }, [recentExecutions]);

 const filteredJobs = jobs
  .filter((job) => {
   const matchesSearch =
    job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.schedule.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.tags.some((tag) =>
     tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
   const jobEnabled = Boolean(job.enabled);
   const matchesFilter = filterEnabled === null || jobEnabled === filterEnabled;
   return matchesSearch && matchesFilter;
  })
  .sort(
   (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

 if (loading) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='loading-spinner h-12 w-12'></div>
   </div>
  );
 }

 // Build a last-run lookup from recent executions
 const normalizeId = (id: string) => id.replace(/^job:/, '').replace(/-/g, '');
 const lastRunByJob: Record<string, string> = recentList.reduce((acc, ex) => {
  const key = normalizeId(ex.jobId);
  const ts = new Date(ex.startedAt).getTime();
  if (!acc[key] || ts > new Date(acc[key]).getTime()) acc[key] = ex.startedAt;
  return acc;
 }, {} as Record<string, string>);

 return (
  <div className='max-w-7xl mx-auto space-y-8'>
   {/* Page Header */}
   <div className='text-center space-y-2'>
    <h1 className='page-header-title'>Jobs</h1>
    <p className='text-neutral-600 text-lg'>
     Read-only list of jobs registered through the SDK
    </p>
   </div>

   {/* Controls (search/filter/view only) */}
   <Card className='card-primary'>
    <CardContent className='p-6'>
     <div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
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
         onClick={() => updateEnabledFilter('all')}
         className={filterEnabled === null ? 'btn-primary' : 'btn-secondary'}
        >
         All
        </Button>
        <Button
         variant={filterEnabled === true ? 'default' : 'outline'}
         size='sm'
         onClick={() => updateEnabledFilter('true')}
         className={filterEnabled === true ? 'btn-success' : 'btn-secondary'}
        >
         Active
        </Button>
        <Button
         variant={filterEnabled === false ? 'default' : 'outline'}
         size='sm'
         onClick={() => updateEnabledFilter('false')}
         className={filterEnabled === false ? 'btn-secondary' : 'btn-secondary'}
        >
         Disabled
        </Button>
       </div>
      </div>
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
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Jobs List/Grid */}
   {filteredJobs.length === 0 ? (
    <Card className='card-primary'>
     <CardContent className='p-12 text-center'>
      <h3 className='text-lg font-medium text-neutral-900 mb-2'>
       No jobs found
      </h3>
      <p className='text-neutral-600 mb-2'>
       Jobs are defined in your application via the Chronos SDK.
      </p>
      <p className='text-neutral-600'>
       Install the SDK and register jobs to see them here.
      </p>
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
        <div className='flex items-center justify-between'>
         <div className='flex items-center gap-3'>
          <span className='text-2xl'>⚙️</span>
          <div>
           <h3 className='font-semibold text-neutral-900 truncate'>
            {job.name}
           </h3>
           <p className='text-sm text-neutral-600 truncate'>{job.schedule}</p>
          </div>
         </div>
         <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
           job.enabled ? 'badge-success' : 'badge-warning'
          }`}
         >
          {job.enabled ? 'Active' : 'Disabled'}
         </span>
        </div>
        <div className='flex items-center justify-between pt-4 border-t border-neutral-100'>
         <div className='flex items-center gap-4 text-sm text-neutral-600'>
          <span>
           {job.schedule && job.schedule.trim() !== ''
            ? job.schedule
            : 'One-time'}
          </span>
          <span>
           Last run:{' '}
           {lastRunByJob[normalizeId(job.id)]
            ? formatDateTime(lastRunByJob[normalizeId(job.id)])
            : job.lastRun
            ? formatDateTime(job.lastRun)
            : 'Never'}
          </span>
         </div>
         <div className='flex items-center gap-2'>
          <Button
           variant='outline'
           size='sm'
           className='btn-secondary'
           onClick={() =>
            router.push(`/jobs/${encodeURIComponent(job.id)}/executions`)
           }
          >
           View
          </Button>
         </div>
        </div>
       </CardContent>
      </Card>
     ))}
    </div>
   )}
  </div>
 );
}
