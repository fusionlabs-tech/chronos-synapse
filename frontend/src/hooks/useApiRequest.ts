import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

interface ApiRequestOptions extends RequestInit {
 skipAuth?: boolean;
 showErrorToast?: boolean;
}

export const useApiRequest = () => {
 const router = useRouter();
 const { logout } = useAuth();
 const { showToast } = useToast();

 const handleTokenExpiration = useCallback(() => {
  showToast('Your session has expired. Please log in again.', 'warning');

  // Store current path for redirect after login
  const currentPath = window.location.pathname + window.location.search;
  if (currentPath !== '/auth/login' && currentPath !== '/auth/register') {
   sessionStorage.setItem('redirectAfterLogin', currentPath);
  }

  logout();
 }, [logout, showToast]);

 const apiRequest = useCallback(
  async (url: string, options: ApiRequestOptions = {}) => {
   const {
    skipAuth = false,
    showErrorToast = true,
    ...requestOptions
   } = options;

   // Add auth header if not skipped
   if (!skipAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
     requestOptions.headers = {
      ...requestOptions.headers,
      Authorization: `Bearer ${token}`,
     };
    }
   }

   try {
    const response = await fetch(url, {
     ...requestOptions,
     headers: {
      'Content-Type': 'application/json',
      ...requestOptions.headers,
     },
    });

    // Handle token expiration
    if (response.status === 401) {
     handleTokenExpiration();
     throw new Error('Unauthorized - Token expired');
    }

    return response;
   } catch (error) {
    if (error instanceof Error && error.message.includes('Token expired')) {
     throw error;
    }

    // Handle network errors
    if (showErrorToast) {
     showToast('Network error occurred. Please try again.', 'error');
    }
    throw error;
   }
  },
  [handleTokenExpiration, showToast]
 );

 return { apiRequest };
};
