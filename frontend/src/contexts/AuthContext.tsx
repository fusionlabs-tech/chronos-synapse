'use client';

import React, {
 createContext,
 useContext,
 useEffect,
 useState,
 ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

interface User {
 id: string;
 email: string;
 username: string;
 firstName: string;
 lastName: string;
 role: 'USER' | 'ADMIN';
 isActive: boolean;
 createdAt: Date;
 updatedAt: Date;
 lastLoginAt?: Date | null;
}

interface AuthContextType {
 user: User | null;
 token: string | null;
 isLoading: boolean;
 login: (
  email: string,
  password: string
 ) => Promise<{ success: boolean; error?: string }>;
 register: (
  userData: RegisterData
 ) => Promise<{ success: boolean; error?: string }>;
 resetPassword: (email: string) => Promise<boolean>;
 confirmResetPassword: (token: string, newPassword: string) => Promise<boolean>;
 logout: () => void;
 updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
 email: string;
 username: string;
 firstName: string;
 lastName: string;
 password: string;
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
      setToken(null);
      setUser(null);

      // Show toast notification
      showToast('Your session has expired. Please log in again.', 'warning');

      // Store current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/auth/login' && currentPath !== '/auth/register') {
       sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
     }
    }
   } catch (error) {
    console.error('Failed to initialize auth:', error);
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
   } finally {
    setIsLoading(false);
   }
  };

  initializeAuth();
 }, []);

 const login = async (email: string, password: string) => {
  try {
   setIsLoading(true);
   const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
    {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
     },
     body: JSON.stringify({ email, password }),
    }
   );

   const data = await response.json();

   if (response.ok) {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);

    // Redirect to stored path or dashboard
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
     sessionStorage.removeItem('redirectAfterLogin');
     window.location.href = redirectPath;
    } else {
     window.location.href = '/dashboard';
    }

    return { success: true };
   } else {
    return { success: false, error: data.message || 'Login failed' };
   }
  } catch (error) {
   console.error('Login error:', error);
   return { success: false, error: 'Network error occurred' };
  } finally {
   setIsLoading(false);
  }
 };

 const register = async (userData: RegisterData) => {
  try {
   setIsLoading(true);
   const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
    {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
     },
     body: JSON.stringify(userData),
    }
   );

   const data = await response.json();

   if (response.ok) {
    setUser(data.user);
    return { success: true };
   } else {
    return { success: false, error: data.message || 'Registration failed' };
   }
  } catch (error) {
   console.error('Registration error:', error);
   return { success: false, error: 'Network error occurred' };
  } finally {
   setIsLoading(false);
  }
 };

 const logout = () => {
  // Call logout endpoint to invalidate session
  if (token) {
   fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
     Authorization: `Bearer ${token}`,
     'Content-Type': 'application/json',
    },
   }).catch(console.error);
  }

  // Clear local state
  setUser(null);
  setToken(null);
  localStorage.removeItem('auth_token');

  // Redirect to login
  router.push('/auth/login');
 };

 const updateUser = (userData: Partial<User>) => {
  if (user) {
   setUser({ ...user, ...userData });
  }
 };

 const resetPassword = async (email: string): Promise<boolean> => {
  try {
   const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
    {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
     },
     body: JSON.stringify({ email }),
    }
   );

   if (response.ok) {
    return true;
   } else {
    const error = await response.json();
    console.error('Reset password error:', error);
    return false;
   }
  } catch (error) {
   console.error('Reset password error:', error);
   return false;
  }
 };

 const confirmResetPassword = async (
  token: string,
  newPassword: string
 ): Promise<boolean> => {
  try {
   const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password/confirm`,
    {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
     },
     body: JSON.stringify({ token, newPassword }),
    }
   );

   if (response.ok) {
    return true;
   } else {
    const error = await response.json();
    console.error('Confirm reset password error:', error);
    return false;
   }
  } catch (error) {
   console.error('Confirm reset password error:', error);
   return false;
  }
 };

 const value: AuthContextType = {
  user,
  token,
  isLoading,
  login,
  register,
  resetPassword,
  confirmResetPassword,
  logout,
  updateUser,
 };

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
