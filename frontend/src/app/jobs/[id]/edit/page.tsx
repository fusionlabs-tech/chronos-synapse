'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { JobForm } from '@/components/forms/JobForm';
import { Job } from '@/types';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import BackButton from '@/components/BackButton';
import { Settings, Edit } from 'lucide-react';

export default function EditJobPage() {
 const router = useRouter();
 const params = useParams();
 const jobId = params.id as string;
 const { showToast } = useToast();

 const [job, setJob] = useState<Job | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const fetchJob = async () => {
   try {
    console.log('Fetching job with ID:', jobId);
    const jobData = await apiClient.getJob(jobId);
    console.log('Job data received:', jobData);
    setJob(jobData);
   } catch (err) {
    setError('Failed to load job');
    console.error('Failed to fetch job:', err);
    showToast('Failed to load job details', 'error');
   } finally {
    setLoading(false);
   }
  };

  if (jobId) {
   fetchJob();
  }
 }, [jobId, showToast]);

 const handleSuccess = () => {
  showToast('Job updated successfully!', 'success');
  router.push('/jobs');
 };

 const handleCancel = () => {
  router.back();
 };

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
     <div className='page-header-icon'>
      <Settings className='h-10 w-10 text-white' />
     </div>
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
  <div className='max-w-4xl mx-auto space-y-8'>
   {/* Page Header */}
   <div className='text-center space-y-4'>
    <div className='page-header-icon'>
     <Edit className='h-10 w-10 text-white' />
    </div>
    <div>
     <h1 className='page-header-title'>Edit Job</h1>
     <p className='text-neutral-600 mt-2 text-lg'>
      Update configuration and settings for "{job.name}"
     </p>
    </div>
   </div>

   {/* Back Button */}
   <div className='flex justify-start'>
    <BackButton href='/jobs' label='Back to Jobs' />
   </div>

   {/* Job Form */}
   <div className='bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8'>
    <JobForm job={job} onSuccess={handleSuccess} onCancel={handleCancel} />
   </div>
  </div>
 );
}
