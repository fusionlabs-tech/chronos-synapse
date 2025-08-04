'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
 Mail,
 Lock,
 Eye,
 EyeOff,
 ArrowRight,
 Shield,
 Zap,
 ArrowLeft,
} from 'lucide-react';

export default function ResetPasswordPage() {
 const [email, setEmail] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [step, setStep] = useState<'request' | 'reset'>('request');
 const { resetPassword, confirmResetPassword } = useAuth();
 const { showToast } = useToast();
 const router = useRouter();
 const searchParams = useSearchParams();
 const token = searchParams.get('token');

 // If token is present, we're in reset step
 useEffect(() => {
  if (token) {
   setStep('reset');
  }
 }, [token]);

 const handleRequestReset = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
   const success = await resetPassword(email);
   if (success) {
    showToast('Password reset email sent! Check your inbox.', 'success');
    setStep('reset');
   } else {
    showToast('Failed to send reset email. Please try again.', 'error');
   }
  } catch (error) {
   console.error('Reset request error:', error);
   showToast('Failed to send reset email. Please try again.', 'error');
  } finally {
   setLoading(false);
  }
 };

 const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();

  if (newPassword !== confirmPassword) {
   showToast('Passwords do not match', 'error');
   return;
  }

  if (newPassword.length < 8) {
   showToast('Password must be at least 8 characters long', 'error');
   return;
  }

  if (!token) {
   showToast('Invalid reset token', 'error');
   return;
  }

  setLoading(true);

  try {
   const success = await confirmResetPassword(token, newPassword);
   if (success) {
    showToast('Password reset successfully! You can now sign in.', 'success');
    router.push('/auth/login');
   } else {
    showToast('Failed to reset password. Please try again.', 'error');
   }
  } catch (error) {
   console.error('Reset password error:', error);
   showToast('Failed to reset password. Please try again.', 'error');
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
      {step === 'request' ? 'Reset Password' : 'Set New Password'}
     </h1>
     <p className='text-neutral-600 text-lg'>
      {step === 'request'
       ? 'Enter your email to receive a reset link'
       : 'Enter your new password'}
     </p>
    </div>

    {/* Reset Form */}
    <div className='card-primary p-8'>
     {step === 'request' ? (
      <form onSubmit={handleRequestReset} className='space-y-6'>
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

       <Button
        type='submit'
        disabled={loading}
        className='w-full btn-primary py-3 flex items-center justify-center gap-2'
       >
        {loading ? (
         <>
          <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent'></div>
          Sending Reset Link...
         </>
        ) : (
         <>
          Send Reset Link
          <ArrowRight className='h-4 w-4' />
         </>
        )}
       </Button>
      </form>
     ) : (
      <form onSubmit={handleResetPassword} className='space-y-6'>
       <div className='space-y-2'>
        <Label
         htmlFor='newPassword'
         className='text-sm font-medium text-neutral-700'
        >
         New Password
        </Label>
        <div className='relative'>
         <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400' />
         <Input
          id='newPassword'
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder='Enter new password'
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
       </div>

       <div className='space-y-2'>
        <Label
         htmlFor='confirmPassword'
         className='text-sm font-medium text-neutral-700'
        >
         Confirm New Password
        </Label>
        <div className='relative'>
         <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400' />
         <Input
          id='confirmPassword'
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder='Confirm new password'
          className='input-primary pl-10 pr-10'
          required
         />
         <button
          type='button'
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className='absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600'
         >
          {showConfirmPassword ? (
           <EyeOff className='h-5 w-5' />
          ) : (
           <Eye className='h-5 w-5' />
          )}
         </button>
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
          Resetting Password...
         </>
        ) : (
         <>
          Reset Password
          <ArrowRight className='h-4 w-4' />
         </>
        )}
       </Button>
      </form>
     )}

     {/* Divider */}
     <div className='my-6 flex items-center'>
      <div className='flex-1 border-t border-neutral-200'></div>
      <span className='px-4 text-sm text-neutral-500'>or</span>
      <div className='flex-1 border-t border-neutral-200'></div>
     </div>

     {/* Back to Login */}
     <div className='text-center'>
      <Link
       href='/auth/login'
       className='inline-flex items-center gap-2 font-medium text-primary-600 hover:text-primary-700 transition-colors'
      >
       <ArrowLeft className='h-4 w-4' />
       Back to Sign In
      </Link>
     </div>
    </div>

    {/* Features */}
    <div className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-4'>
     <div className='text-center p-4 card-secondary'>
      <div className='w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3'>
       <Zap className='h-6 w-6 text-primary-600' />
      </div>
      <h3 className='font-medium text-neutral-900 mb-1'>Secure Reset</h3>
      <p className='text-sm text-neutral-600'>
       Time-limited secure reset links
      </p>
     </div>

     <div className='text-center p-4 card-secondary'>
      <div className='w-12 h-12 mx-auto bg-secondary-100 rounded-full flex items-center justify-center mb-3'>
       <Shield className='h-6 w-6 text-secondary-600' />
      </div>
      <h3 className='font-medium text-neutral-900 mb-1'>Email Verified</h3>
      <p className='text-sm text-neutral-600'>Reset links sent to your email</p>
     </div>

     <div className='text-center p-4 card-secondary'>
      <div className='w-12 h-12 mx-auto bg-accent-green-100 rounded-full flex items-center justify-center mb-3'>
       <span className='text-2xl'>🔐</span>
      </div>
      <h3 className='font-medium text-neutral-900 mb-1'>Strong Passwords</h3>
      <p className='text-sm text-neutral-600'>Enhanced security requirements</p>
     </div>
    </div>
   </div>
  </div>
 );
}
