'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
 Home,
 Search,
 ArrowLeft,
 Zap,
 Clock,
 AlertTriangle,
 Smile,
 Rocket,
 Coffee,
 Bug,
} from 'lucide-react';

export default function NotFound() {
 const funnyMessages = [
  'Oops! Looks like this cron job got lost in the time-space continuum! 🕰️',
  "404: The page you're looking for is taking a coffee break ☕",
  'This route seems to have been scheduled for deletion! 🗑️',
  'Error 404: Page not found (but we found this cool error page instead!) 🎉',
  'Looks like someone forgot to set up this cron job! ⚡',
  'This page is currently on vacation. Please try again later! 🏖️',
  "404: The page you're seeking has been abducted by aliens 👽",
  'Oops! This page decided to go rogue and quit its job! 🦹‍♂️',
  'Error 404: Page not found (but we found your sense of humor!) 😄',
  'This route is currently experiencing technical difficulties... and existential crisis! 🤔',
 ];

 const randomMessage =
  funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

 return (
  <div className='min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 flex items-center justify-center p-4'>
   <div className='max-w-2xl w-full'>
    <Card className='card-primary border-0 shadow-2xl'>
     <CardContent className='p-12 text-center'>
      {/* Fun 404 Display */}
      <div className='mb-8'>
       <div className='text-8xl font-bold gradient-text-primary mb-4'>
        4<span className='text-6xl'>🤖</span>4
       </div>
       <div className='text-6xl mb-4'>
        <span className='animate-bounce inline-block'>🚀</span>
        <span className='animate-pulse inline-block mx-2'>⚡</span>
        <span className='animate-bounce inline-block'>🎯</span>
       </div>
      </div>

      {/* Funny Message */}
      <h1 className='text-2xl font-bold text-neutral-900 mb-4'>
       {randomMessage}
      </h1>

      <p className='text-neutral-600 mb-8 text-lg'>
       Don't worry, even the best cron jobs sometimes miss their schedule! Let's
       get you back on track. 🎯
      </p>

      {/* Fun Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
       <div className='flex items-center justify-center gap-2 p-3 bg-primary-50 rounded-lg'>
        <Clock className='h-5 w-5 text-primary-600' />
        <span className='text-sm font-medium text-primary-700'>
         Time Lost: 0.0001s
        </span>
       </div>
       <div className='flex items-center justify-center gap-2 p-3 bg-accent-green-50 rounded-lg'>
        <Smile className='h-5 w-5 text-accent-green-600' />
        <span className='text-sm font-medium text-accent-green-700'>
         Mood: Still Happy
        </span>
       </div>
       <div className='flex items-center justify-center gap-2 p-3 bg-accent-orange-50 rounded-lg'>
        <Coffee className='h-5 w-5 text-accent-orange-600' />
        <span className='text-sm font-medium text-accent-orange-700'>
         Coffee: Still Hot
        </span>
       </div>
      </div>

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row gap-4 justify-center'>
       <Button onClick={() => window.history.back()} className='btn-secondary'>
        <ArrowLeft className='h-4 w-4 mr-2' />
        Go Back
       </Button>

       <Link href='/dashboard'>
        <Button className='btn-primary'>
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
        <span>
         Bug Report: This page is working as intended (it's supposed to be
         funny!)
        </span>
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
        💡 Pro tip: If you're seeing this page, it means our error handling is
        working perfectly!
       </p>
       <p className='mt-1'>🎭 This is not a bug, it's a feature!</p>
      </div>
     </CardContent>
    </Card>
   </div>
  </div>
 );
}
