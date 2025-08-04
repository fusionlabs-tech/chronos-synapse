'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
 const router = useRouter();

 useEffect(() => {
  // Redirect to dashboard on page load
  router.replace('/dashboard');
 }, [router]);

 return (
  <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100'>
   <div className='text-center'>
    <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4'></div>
    <h1 className='text-2xl font-bold text-gray-900 mb-2'>Chronos Synapse</h1>
    <p className='text-gray-600'>Loading dashboard...</p>
   </div>
  </div>
 );
}
