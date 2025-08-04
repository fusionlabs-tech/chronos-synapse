'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap } from 'lucide-react';

export default function LoginPage() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const { login } = useAuth();
 const { showToast } = useToast();
 const router = useRouter();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
   const success = await login(email, password);
   if (success) {
    showToast('Login successful!', 'success');
    router.push('/dashboard');
   } else {
    showToast('Invalid email or password', 'error');
   }
  } catch (error) {
   console.error('Login error:', error);
   showToast('Login failed. Please try again.', 'error');
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className='min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 flex items-center justify-center p-4'>
   <div className='w-full max-w-md'>
    {/* Logo and Header */}
    <div className='text-center mb-8'>
     <div className='w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-6 shadow-xl'>
      <span className='text-white text-2xl font-bold'>⚡</span>
     </div>
     <h1 className='text-3xl font-bold gradient-text-primary mb-2'>
      Welcome Back
     </h1>
     <p className='text-neutral-600 text-lg'>
      Sign in to your Chronos Synapse account
     </p>
    </div>

    {/* Login Form */}
    <div className='card-primary p-8'>
     <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-2'>
       <Label htmlFor='email' className='text-sm font-medium text-neutral-700'>
        Email Address
       </Label>
       <div className='relative'>
        <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400' />
        <Input
         id='email'
         type='email'
         value={email}
         onChange={(e) => setEmail(e.target.value)}
         placeholder='Enter your email'
         className='input-primary pl-10'
         required
        />
       </div>
      </div>

      <div className='space-y-2'>
       <Label
        htmlFor='password'
        className='text-sm font-medium text-neutral-700'
       >
        Password
       </Label>
       <div className='relative'>
        <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400' />
        <Input
         id='password'
         type={showPassword ? 'text' : 'password'}
         value={password}
         onChange={(e) => setPassword(e.target.value)}
         placeholder='Enter your password'
         className='input-primary pl-10 pr-10'
         required
        />
        <button
         type='button'
         onClick={() => setShowPassword(!showPassword)}
         className='absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600'
        >
         {showPassword ? (
          <EyeOff className='h-5 w-5' />
         ) : (
          <Eye className='h-5 w-5' />
         )}
        </button>
       </div>
       <div className='text-right'>
        <Link
         href='/auth/reset-password'
         className='text-sm text-primary-600 hover:text-primary-700 transition-colors'
        >
         Forgot your password?
        </Link>
       </div>
      </div>

      <Button
       type='submit'
       disabled={loading}
       className='w-full btn-primary py-3 flex items-center justify-center gap-2'
      >
       {loading ? (
        <>
         <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent'></div>
         Signing In...
        </>
       ) : (
        <>
         Sign In
         <ArrowRight className='h-4 w-4' />
        </>
       )}
      </Button>
     </form>

     {/* Divider */}
     <div className='my-6 flex items-center'>
      <div className='flex-1 border-t border-neutral-200'></div>
      <span className='px-4 text-sm text-neutral-500'>or</span>
      <div className='flex-1 border-t border-neutral-200'></div>
     </div>

     {/* Register Link */}
     <div className='text-center'>
      <p className='text-neutral-600 text-sm'>
       Don't have an account?{' '}
       <Link
        href='/auth/register'
        className='font-medium text-primary-600 hover:text-primary-700 transition-colors'
       >
        Create one here
       </Link>
      </p>
     </div>
    </div>

    {/* Features */}
    <div className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-4'>
     <div className='text-center p-4 card-secondary'>
      <div className='w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3'>
       <Zap className='h-6 w-6 text-primary-600' />
      </div>
      <h3 className='font-medium text-neutral-900 mb-1'>Lightning Fast</h3>
      <p className='text-sm text-neutral-600'>
       Execute jobs with incredible speed
      </p>
     </div>

     <div className='text-center p-4 card-secondary'>
      <div className='w-12 h-12 mx-auto bg-secondary-100 rounded-full flex items-center justify-center mb-3'>
       <Shield className='h-6 w-6 text-secondary-600' />
      </div>
      <h3 className='font-medium text-neutral-900 mb-1'>Secure & Reliable</h3>
      <p className='text-sm text-neutral-600'>Enterprise-grade security</p>
     </div>

     <div className='text-center p-4 card-secondary'>
      <div className='w-12 h-12 mx-auto bg-accent-green-100 rounded-full flex items-center justify-center mb-3'>
       <span className='text-2xl'>🤖</span>
      </div>
      <h3 className='font-medium text-neutral-900 mb-1'>AI Powered</h3>
      <p className='text-sm text-neutral-600'>
       Intelligent insights & optimization
      </p>
     </div>
    </div>
   </div>
  </div>
 );
}
