'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toast';
import {
 Bug,
 Zap,
 AlertTriangle,
 Rocket,
 Coffee,
 Smile,
 Bomb,
 Flame,
 Sparkles,
} from 'lucide-react';

export default function TestErrorPage() {
 const [loading, setLoading] = useState(false);
 const { showToast } = useToast();

 // Method 1: Throw an error in event handler
 const triggerEventError = () => {
  // Use setTimeout to ensure the error is thrown in the next tick
  setTimeout(() => {
   throw new Error('🎭 This is a test error triggered by a button click!');
  }, 0);
 };

 // Method 2: Throw an error in useEffect
 const triggerUseEffectError = () => {
  setLoading(true);
  // Simulate async operation that throws
  setTimeout(() => {
   throw new Error('⏰ This error was triggered by a useEffect timeout!');
  }, 1000);
 };

 // Method 3: Access undefined property
 const triggerUndefinedError = () => {
  // Use setTimeout to ensure the error is thrown in the next tick
  setTimeout(() => {
   const obj: any = null;
   obj.nonExistentProperty.someMethod(); // This will throw TypeError
  }, 0);
 };

 // Method 4: JSON parse error
 const triggerJSONError = () => {
  // Use setTimeout to ensure the error is thrown in the next tick
  setTimeout(() => {
   JSON.parse('invalid json string'); // This will throw SyntaxError
  }, 0);
 };

 // Method 5: Async error
 const triggerAsyncError = async () => {
  setLoading(true);
  try {
   await new Promise((_, reject) => {
    setTimeout(() => {
     reject(new Error('🚀 This is an async error from a Promise!'));
    }, 1000);
   });
  } catch (error) {
   // Re-throw in next tick to trigger error boundary
   setTimeout(() => {
    throw error;
   }, 0);
  } finally {
   setLoading(false);
  }
 };

 // Method 6: Network error simulation
 const triggerNetworkError = async () => {
  setLoading(true);
  try {
   const response = await fetch('/api/non-existent-endpoint');
   if (!response.ok) {
    throw new Error(
     `🌐 Network error: ${response.status} ${response.statusText}`
    );
   }
  } catch (error) {
   // Re-throw in next tick to trigger error boundary
   setTimeout(() => {
    throw new Error(
     `🌐 Network error: ${
      error instanceof Error ? error.message : 'Unknown network error'
     }`
    );
   }, 0);
  } finally {
   setLoading(false);
  }
 };

 // Method 7: Recursive function to cause stack overflow
 const triggerStackOverflow = () => {
  const recursiveFunction = () => {
   recursiveFunction();
  };
  recursiveFunction();
 };

 // Method 8: Memory error simulation
 const triggerMemoryError = () => {
  const arr = [];
  while (true) {
   arr.push(new Array(1000000)); // Try to allocate large arrays
  }
 };

 // Method 9: Custom error with digest
 const triggerCustomError = () => {
  const error = new Error('🎪 Custom error with special message!');
  (error as any).digest = 'test-error-digest-12345';
  throw error;
 };

 // Method 10: Error in render
 const [shouldRenderError, setShouldRenderError] = useState(false);

 if (shouldRenderError) {
  throw new Error('🎨 This error was triggered during render!');
 }

 return (
  <div className='space-y-6'>
   {/* Header */}
   <div className='flex items-center justify-between'>
    <div>
     <h2 className='text-2xl font-bold gradient-text-primary'>
      Error Testing Lab
     </h2>
     <p className='text-neutral-600 mt-1'>
      Test various ways to trigger the global error page
     </p>
    </div>
    <div className='flex items-center gap-2'>
     <Bug className='h-5 w-5 text-primary-600' />
     <span className='text-sm text-neutral-500'>Error Testing Mode</span>
    </div>
   </div>

   {/* Warning Card */}
   <Card className='card-warning border-accent-orange-200'>
    <CardHeader>
     <CardTitle className='flex items-center gap-2 text-accent-orange-800'>
      <AlertTriangle className='h-5 w-5' />
      ⚠️ Warning: This page is for testing only!
     </CardTitle>
    </CardHeader>
    <CardContent>
     <p className='text-accent-orange-700'>
      Clicking any of these buttons will trigger the global error page. This is
      useful for testing error handling and the fun error page design.
     </p>
    </CardContent>
   </Card>

   {/* Error Trigger Methods */}
   <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
    {/* Basic Errors */}
    <Card className='card-primary'>
     <CardHeader>
      <CardTitle className='flex items-center gap-2'>
       <Bomb className='h-5 w-5' />
       Basic Error Triggers
      </CardTitle>
     </CardHeader>
     <CardContent className='space-y-3'>
      <Button
       onClick={triggerEventError}
       className='w-full btn-danger'
       disabled={loading}
      >
       <Zap className='h-4 w-4 mr-2' />
       Event Handler Error
      </Button>

      <Button
       onClick={triggerUndefinedError}
       className='w-full btn-danger'
       disabled={loading}
      >
       <Flame className='h-4 w-4 mr-2' />
       Undefined Property Error
      </Button>

      <Button
       onClick={triggerJSONError}
       className='w-full btn-danger'
       disabled={loading}
      >
       <Zap className='h-4 w-4 mr-2' />
       JSON Parse Error
      </Button>

      <Button
       onClick={triggerCustomError}
       className='w-full btn-danger'
       disabled={loading}
      >
       <Sparkles className='h-4 w-4 mr-2' />
       Custom Error with Digest
      </Button>
     </CardContent>
    </Card>

    {/* Async Errors */}
    <Card className='card-primary'>
     <CardHeader>
      <CardTitle className='flex items-center gap-2'>
       <Rocket className='h-5 w-5' />
       Async Error Triggers
      </CardTitle>
     </CardHeader>
     <CardContent className='space-y-3'>
      <Button
       onClick={triggerAsyncError}
       className='w-full btn-danger'
       disabled={loading}
      >
       <Coffee className='h-4 w-4 mr-2' />
       Async Promise Error
      </Button>

      <Button
       onClick={triggerNetworkError}
       className='w-full btn-danger'
       disabled={loading}
      >
       <Smile className='h-4 w-4 mr-2' />
       Network Error
      </Button>

      <Button
       onClick={triggerUseEffectError}
       className='w-full btn-danger'
       disabled={loading}
      >
       <Bug className='h-4 w-4 mr-2' />
       Timeout Error
      </Button>

      <Button
       onClick={() => setShouldRenderError(true)}
       className='w-full btn-danger'
       disabled={loading}
      >
       <AlertTriangle className='h-4 w-4 mr-2' />
       Render Error
      </Button>
     </CardContent>
    </Card>

    {/* Dangerous Errors (Commented out for safety) */}
    <Card className='card-primary opacity-50'>
     <CardHeader>
      <CardTitle className='flex items-center gap-2'>
       <Flame className='h-5 w-5' />
       Dangerous Errors (Disabled)
      </CardTitle>
     </CardHeader>
     <CardContent className='space-y-3'>
      <Button className='w-full btn-secondary' disabled>
       <Flame className='h-4 w-4 mr-2' />
       Stack Overflow (Disabled)
      </Button>

      <Button className='w-full btn-secondary' disabled>
       <Zap className='h-4 w-4 mr-2' />
       Memory Error (Disabled)
      </Button>
     </CardContent>
    </Card>

    {/* Info Card */}
    <Card className='card-primary'>
     <CardHeader>
      <CardTitle className='flex items-center gap-2'>
       <Smile className='h-5 w-5' />
       Error Page Features
      </CardTitle>
     </CardHeader>
     <CardContent className='space-y-2 text-sm'>
      <div className='flex items-center gap-2'>
       <span className='w-2 h-2 bg-primary-500 rounded-full'></span>
       <span>Random funny error messages</span>
      </div>
      <div className='flex items-center gap-2'>
       <span className='w-2 h-2 bg-accent-green-500 rounded-full'></span>
       <span>Animated emojis and icons</span>
      </div>
      <div className='flex items-center gap-2'>
       <span className='w-2 h-2 bg-accent-orange-500 rounded-full'></span>
       <span>Fun stats and easter eggs</span>
      </div>
      <div className='flex items-center gap-2'>
       <span className='w-2 h-2 bg-accent-red-500 rounded-full'></span>
       <span>Error recovery options</span>
      </div>
      <div className='flex items-center gap-2'>
       <span className='w-2 h-2 bg-secondary-500 rounded-full'></span>
       <span>Development error details</span>
      </div>
     </CardContent>
    </Card>
   </div>

   {/* Instructions */}
   <Card className='card-primary'>
    <CardHeader>
     <CardTitle className='flex items-center gap-2'>
      <Bug className='h-5 w-5' />
      How to Test
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className='space-y-3 text-sm'>
      <p className='text-neutral-700'>
       <strong>1. Basic Testing:</strong> Click any of the "Basic Error
       Triggers" buttons to see immediate error handling.
      </p>
      <p className='text-neutral-700'>
       <strong>2. Async Testing:</strong> Try the "Async Error Triggers" to test
       error handling in asynchronous operations.
      </p>
      <p className='text-neutral-700'>
       <strong>3. Error Recovery:</strong> Once the error page appears, try the
       "Try Again" button to test error recovery.
      </p>
      <p className='text-neutral-700'>
       <strong>4. Navigation:</strong> Use the "Go Home" or "View Jobs" buttons
       to test navigation from error pages.
      </p>
      <p className='text-neutral-700'>
       <strong>5. Development Mode:</strong> In development, you'll see detailed
       error information and error digest.
      </p>
     </div>
    </CardContent>
   </Card>

   {loading && (
    <div className='flex items-center justify-center p-4'>
     <div className='animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-600'></div>
     <span className='ml-3 text-neutral-600'>
      Preparing to trigger error...
     </span>
    </div>
   )}
  </div>
 );
}
