'use client';

import React, {
 createContext,
 useContext,
 useEffect,
 useState,
 ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toasts';
import { User } from '@/types';

interface AuthContextType {
 user: User | null;
 token: string | null;
 isLoading: boolean;
 loginWithGoogle: () => void;
 loginWithGitHub: () => void;
 logout: () => void;
 updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
 const context = useContext(AuthContext);
 if (context === undefined) {
  throw new Error('useAuth must be used within an AuthProvider');
 }
 return context;
};

interface AuthProviderProps {
 children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
 const [user, setUser] = useState<User | null>(null);
 const [token, setToken] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
 const router = useRouter();
 const { showToast } = useToast();

 // Initialize auth state from localStorage
 useEffect(() => {
  const initializeAuth = async () => {
   try {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
     // Verify token with backend
     const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
      {
       headers: {
        Authorization: `Bearer ${storedToken}`,
        'Content-Type': 'application/json',
       },
      }
     );

     if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      setToken(storedToken);
     } else {
      // Token is invalid, clear it
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      setUser(null);
     }
    }
   } catch (error) {
    console.error('Auth initialization error:', error);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
   } finally {
    setIsLoading(false);
   }
  };

  // Don't initialize auth if we're processing OAuth
  if (!isProcessingOAuth) {
   initializeAuth();
  }
 }, [showToast, isProcessingOAuth]);

 // Handle OAuth redirect with tokens
 useEffect(() => {
  const handleOAuthRedirect = async () => {
   const urlParams = new URLSearchParams(window.location.search);
   const accessToken = urlParams.get('access_token');
   const refreshToken = urlParams.get('refresh_token');
   const error = urlParams.get('error');

   if (error) {
    showToast(`OAuth error: ${error}`, 'error');
    router.push('/auth/login');
    return;
   }

   if (accessToken && refreshToken) {
    setIsProcessingOAuth(true);

    try {
     // Store tokens
     localStorage.setItem('auth_token', accessToken);
     localStorage.setItem('refresh_token', refreshToken);
     setToken(accessToken);

     // Fetch user data
     const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
      {
       headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
       },
      }
     );

     if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
     }

     const data = await response.json();
     setUser(data.user);
     showToast('Login successful!', 'success');

     // Check for stored redirect path
     const stored = sessionStorage.getItem('redirectAfterLogin');
     const redirectPath = stored && stored !== '/auth/login' ? stored : null;
     const finalRedirectPath = redirectPath || '/dashboard';

     if (stored) {
      sessionStorage.removeItem('redirectAfterLogin');
     }

     // Clean up URL first
     window.history.replaceState({}, document.title, window.location.pathname);

     // Then redirect
     router.push(finalRedirectPath);
    } catch (error) {
     console.error('Failed to fetch user data:', error);
     showToast('Login failed. Please try again.', 'error');
     router.push('/auth/login');
    } finally {
     setIsProcessingOAuth(false);
    }
   }
  };

  // Check if this is an OAuth redirect
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('access_token') || urlParams.get('error')) {
   handleOAuthRedirect();
  }
 }, [router, showToast]);

 const loginWithGoogle = () => {
  // Store current path for redirect after login
  const current = window.location.pathname;
  sessionStorage.setItem(
   'redirectAfterLogin',
   current && current !== '/auth/login' ? current : '/dashboard'
  );

  // Redirect to backend OAuth endpoint
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
 };

 const loginWithGitHub = () => {
  // Store current path for redirect after login
  const current = window.location.pathname;
  sessionStorage.setItem(
   'redirectAfterLogin',
   current && current !== '/auth/login' ? current : '/dashboard'
  );

  // Redirect to backend OAuth endpoint
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
 };

 const logout = async () => {
  // Get current token before clearing
  const currentToken = token;

  // Call backend logout endpoint first
  if (currentToken) {
   try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
     method: 'POST',
     headers: {
      Authorization: `Bearer ${currentToken}`,
     },
    });
   } catch (error) {
    console.error('Logout error:', error);
    // Continue with logout even if API call fails
   }
  }

  // Clear tokens and user data
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  setToken(null);
  setUser(null);

  showToast('Logged out successfully', 'success');
  router.push('/auth/login');
 };

 const updateUser = (userData: Partial<User>) => {
  setUser((prev) => (prev ? { ...prev, ...userData } : null));
 };

 const value: AuthContextType = {
  user,
  token,
  isLoading,
  loginWithGoogle,
  loginWithGitHub,
  logout,
  updateUser,
 };

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
