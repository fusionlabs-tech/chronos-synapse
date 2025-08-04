'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
 Home,
 RefreshCw,
 AlertTriangle,
 Bug,
 Zap,
 Coffee,
 Rocket,
 Smile,
} from 'lucide-react';

interface ErrorProps {
 error: Error & { digest?: string };
 reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
 useEffect(() => {
  // Log the error to an error reporting service
  console.error('Application error:', error);
 }, [error]);

 const funnyErrorMessages = [
  'Oops! Something went wrong in the time-space continuum! 🕰️',
  'Error: The cron job of life encountered an unexpected exception! ⚡',
  'Looks like our AI got confused and took a wrong turn! 🤖',
  'Error 500: The server is having an existential crisis! 🤔',
  "Something broke, but don't worry - we're on it! 🔧",
  'Error: The page decided to go on strike! 🦹‍♂️',
  'Oops! Our code went rogue and quit its job! 🎭',
  'Error: The server is currently questioning its life choices! 😅',
  "Something went wrong, but at least we're handling it gracefully! 🎉",
  'Error: The application is experiencing technical difficulties... and a midlife crisis! 🚀',
 ];

 const randomMessage =
  funnyErrorMessages[Math.floor(Math.random() * funnyErrorMessages.length)];

 return (
  <div className='min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 flex items-center justify-center p-4'>
   <div className='max-w-2xl w-full'>
    <Card className='card-primary border-0 shadow-2xl'>
     <CardContent className='p-12 text-center'>
      {/* Error Display */}
      <div className='mb-8'>
       <div className='text-6xl mb-4'>
        <span className='animate-pulse inline-block'>💥</span>
        <span className='animate-bounce inline-block mx-2'>⚡</span>
        <span className='animate-pulse inline-block'>💥</span>
       </div>
       <div className='text-4xl font-bold gradient-text-primary mb-4'>
        Oops! Something Broke!
       </div>
      </div>

      {/* Funny Message */}
      <h1 className='text-xl font-bold text-neutral-900 mb-4'>
       {randomMessage}
      </h1>

      <p className='text-neutral-600 mb-6 text-lg'>
       Don't worry, even the best systems have their moments! Our team has been
       notified and is working on a fix. 🛠️
      </p>

      {/* Error Details (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
       <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left'>
        <h3 className='font-semibold text-red-800 mb-2 flex items-center gap-2'>
         <Bug className='h-4 w-4' />
         Error Details (Development)
        </h3>
        <p className='text-sm text-red-700 font-mono break-all'>
         {error.message}
        </p>
        {error.digest && (
         <p className='text-xs text-red-600 mt-2'>Error ID: {error.digest}</p>
        )}
       </div>
      )}

      {/* Fun Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
       <div className='flex items-center justify-center gap-2 p-3 bg-primary-50 rounded-lg'>
        <AlertTriangle className='h-5 w-5 text-primary-600' />
        <span className='text-sm font-medium text-primary-700'>
         Status: Oops!
        </span>
       </div>
       <div className='flex items-center justify-center gap-2 p-3 bg-accent-green-50 rounded-lg'>
        <Smile className='h-5 w-5 text-accent-green-600' />
        <span className='text-sm font-medium text-accent-green-700'>
         Mood: Still Optimistic
        </span>
       </div>
       <div className='flex items-center justify-center gap-2 p-3 bg-accent-orange-50 rounded-lg'>
        <Coffee className='h-5 w-5 text-accent-orange-600' />
        <span className='text-sm font-medium text-accent-orange-700'>
         Coffee: Extra Strong
        </span>
       </div>
      </div>

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row gap-4 justify-center'>
       <Button onClick={reset} className='btn-primary'>
        <RefreshCw className='h-4 w-4 mr-2' />
        Try Again
       </Button>

       <Link href='/dashboard'>
        <Button className='btn-secondary'>
         <Home className='h-4 w-4 mr-2' />
         Go Home
        </Button>
       </Link>

       <Link href='/jobs'>
        <Button className='btn-secondary'>
         <Zap className='h-4 w-4 mr-2' />
         View Jobs
        </Button>
       </Link>
      </div>

      {/* Fun Footer */}
      <div className='mt-8 pt-6 border-t border-neutral-200'>
       <div className='flex items-center justify-center gap-2 text-sm text-neutral-500'>
        <Bug className='h-4 w-4' />
        <span>Bug Report: Our developers are already on it!</span>
        <Rocket className='h-4 w-4' />
       </div>

       <div className='mt-4 flex items-center justify-center gap-1 text-xs text-neutral-400'>
        <span>Made with</span>
        <span className='text-red-500'>❤️</span>
        <span>and lots of</span>
        <span className='text-yellow-500'>☕</span>
        <span>by the Chronos Synapse team</span>
       </div>
      </div>

      {/* Easter Egg */}
      <div className='mt-6 text-xs text-neutral-400'>
       <p>
        💡 Pro tip: If you keep seeing this error, try refreshing the page!
       </p>
       <p className='mt-1'>
        🎭 Remember: Every error is just a feature waiting to be discovered!
       </p>
      </div>
     </CardContent>
    </Card>
   </div>
  </div>
 );
}
