import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

interface ApiRequestOptions extends RequestInit {
 skipAuth?: boolean;
}

export const createApiClient = () => {
 const router = useRouter();
 const { logout } = useAuth();
 const { showToast } = useToast();

 const handleTokenExpiration = () => {
  showToast('Your session has expired. Please log in again.', 'warning');

  // Store current path for redirect after login
  const currentPath = window.location.pathname + window.location.search;
  if (currentPath !== '/auth/login') {
   sessionStorage.setItem('redirectAfterLogin', currentPath);
  }

  logout();
 };

 const apiRequest = async (url: string, options: ApiRequestOptions = {}) => {
  const { skipAuth = false, ...requestOptions } = options;

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
   showToast('Network error occurred. Please try again.', 'error');
   throw error;
  }
 };

 return { apiRequest };
};

// Hook for using the API client
export const useApi = () => {
 return createApiClient();
};
