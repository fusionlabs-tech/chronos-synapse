'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toasts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, LogIn, RefreshCw } from 'lucide-react';

export function SessionExpiredModal() {
 const router = useRouter();
 const pathname = usePathname();
 const { user, token, logout } = useAuth();
 const { showToast } = useToast();
 const [isVisible, setIsVisible] = useState(false);

 useEffect(() => {
  // Check for session expiration on mount and when token changes
  const checkSessionExpiration = () => {
   if (token) {
    try {
     const payload = JSON.parse(atob(token.split('.')[1]));
     const expirationTime = payload.exp * 1000; // Convert to milliseconds
     const currentTime = Date.now();

     if (currentTime >= expirationTime) {
      setIsVisible(true);
     }
    } catch (error) {
     // If token is malformed, show modal
     setIsVisible(true);
    }
   }
  };

  // Check immediately
  checkSessionExpiration();

  // Check every minute for session expiration
  const interval = setInterval(checkSessionExpiration, 60000);

  return () => clearInterval(interval);
 }, [token, logout]);

 const handleLogin = () => {
  // Store current path for redirect after login
  if (pathname && pathname !== '/auth/login') {
   sessionStorage.setItem('redirectAfterLogin', pathname);
  }
  router.push('/auth/login');
 };

 const handleRefresh = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  console.log(
   'Refresh button clicked, refresh token:',
   refreshToken ? 'exists' : 'missing'
  );

  if (refreshToken) {
   try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const refreshUrl = `${apiUrl}/auth/refresh`;
    console.log('Calling refresh endpoint:', refreshUrl);

    const response = await fetch(refreshUrl, {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
     },
     body: JSON.stringify({ refreshToken }),
    });

    console.log('Refresh response status:', response.status);
    const responseText = await response.text();
    console.log('Refresh response body:', responseText);

    if (response.ok) {
     const data = JSON.parse(responseText);
     console.log('Refresh successful, new token received');
     localStorage.setItem('auth_token', data.token);
     setIsVisible(false);

     // Show success message and reload to reinitialize auth context
     showToast('Session refreshed successfully!', 'success');
     window.location.reload();
    } else {
     console.error('Refresh failed with status:', response.status);
     // Refresh failed, redirect to login
     localStorage.removeItem('auth_token');
     localStorage.removeItem('refresh_token');
     router.push('/auth/login');
    }
   } catch (error) {
    console.error('Refresh token error:', error);
    // Refresh failed, redirect to login
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    router.push('/auth/login');
   }
  } else {
   console.log('No refresh token found, redirecting to login');
   // No refresh token, redirect to login
   router.push('/auth/login');
  }
 };

 if (!isVisible) {
  return null;
 }

 return (
  <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
   <Card className='w-full max-w-md mx-auto'>
    <CardHeader className='text-center pb-4'>
     <div className='mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4'>
      <AlertTriangle className='h-6 w-6 text-red-600' />
     </div>
     <CardTitle className='text-xl font-semibold text-gray-900'>
      Session Expired
     </CardTitle>
    </CardHeader>
    <CardContent className='text-center space-y-4'>
     <p className='text-gray-600'>
      Your session has expired. Please log in again to continue.
     </p>

     <div className='flex flex-col gap-3'>
      <Button onClick={handleLogin} className='w-full btn-primary'>
       <LogIn className='h-4 w-4 mr-2' />
       Go to Login
      </Button>

      <Button onClick={handleRefresh} variant='outline' className='w-full'>
       <RefreshCw className='h-4 w-4 mr-2' />
       Refresh Session
      </Button>
     </div>
    </CardContent>
   </Card>
  </div>
 );
}
