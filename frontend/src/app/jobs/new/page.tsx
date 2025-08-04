'use client';

import { useRouter } from 'next/navigation';
import { JobForm } from '@/components/forms/JobForm';
import BackButton from '@/components/BackButton';

export default function NewJobPage() {
 const router = useRouter();

 const handleSuccess = () => {
  router.push('/jobs');
 };

 const handleCancel = () => {
  router.back();
 };

 return (
  <div className='space-y-6'>
   {/* Page Header */}
   <div className='flex items-center justify-between'>
    <div className='flex items-center gap-6'>
     <BackButton href='/jobs' label='Back to Jobs' />
     <div>
      <h1 className='page-header-title text-3xl'>Create New Job</h1>
      <p className='text-neutral-600 mt-1'>
       Set up a new cron job with advanced configuration options
      </p>
     </div>
    </div>
   </div>

   {/* Job Form */}
   <JobForm onSuccess={handleSuccess} onCancel={handleCancel} />
  </div>
 );
}
