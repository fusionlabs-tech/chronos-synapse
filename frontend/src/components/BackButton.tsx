'use client';

import { ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
 href?: string;
 label?: string;
 showHome?: boolean;
 className?: string;
}

export default function BackButton({
 href,
 label = 'Back',
 showHome = false,
 className = '',
}: BackButtonProps) {
 const router = useRouter();

 const handleBack = () => {
  if (href) {
   router.push(href);
  } else {
   router.back();
  }
 };

 const handleHome = () => {
  router.push('/dashboard');
 };

 return (
  <div className={`flex items-center gap-3 ${className}`}>
   {/* Back Button */}
   <button
    onClick={handleBack}
    className='group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md'
   >
    <ArrowLeft className='w-4 h-4 text-gray-600 group-hover:text-gray-800 transition-colors' />
    <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors'>
     {label}
    </span>
   </button>

   {/* Home Button (optional) */}
   {showHome && (
    <button
     onClick={handleHome}
     className='group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md'
    >
     <Home className='w-4 h-4' />
     <span className='text-sm font-medium'>Dashboard</span>
    </button>
   )}
  </div>
 );
}
