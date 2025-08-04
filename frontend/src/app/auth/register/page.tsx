'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
 User,
 ArrowRight,
 CheckCircle,
 Shield,
 Zap,
} from 'lucide-react';

export default function RegisterPage() {
 const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
 });
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const { register } = useAuth();
 const { showToast } = useToast();
 const router = useRouter();

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData((prev) => ({
   ...prev,
   [e.target.name]: e.target.value,
  }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
   showToast('Passwords do not match', 'error');
   return;
  }

  if (formData.password.length < 8) {
   showToast('Password must be at least 8 characters long', 'error');
   return;
  }

  setLoading(true);

  try {
   const success = await register(formData);
   if (success) {
    showToast(
     'Registration successful! Welcome to Chronos Synapse!',
     'success'
    );
    router.push('/dashboard');
   } else {
    showToast('Registration failed. Please try again.', 'error');
   }
  } catch (error) {
   console.error('Registration error:', error);
   showToast('Registration failed. Please try again.', 'error');
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className='min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 flex items-center justify-center p-4'>
   <div className='w-full max-w-lg'>
    {/* Logo and Header */}
    <div className='text-center mb-8'>
     <div className='w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-6 shadow-xl'>
      <span className='text-white text-2xl font-bold'>⚡</span>
     </div>
     <h1 className='text-3xl font-bold gradient-text-primary mb-2'>
      Join Chronos Synapse
     </h1>
     <p className='text-neutral-600 text-lg'>
      Create your account and start managing cron jobs with AI
     </p>
    </div>

    {/* Register Form */}
    <div className='card-primary p-8'>
     <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Name Fields */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
       <div className='space-y-2'>
        <Label
         htmlFor='firstName'
         className='text-sm font-medium text-neutral-700'
        >
         First Name
        </Label>
        <div className='relative'>
         <User className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400' />
         <Input
          id='firstName'
          name='firstName'
          type='text'
          value={formData.firstName}
          onChange={handleChange}
          placeholder='Enter your first name'
          className='input-primary pl-10'
          required
         />
        </div>
       </div>

       <div className='space-y-2'>
        <Label
         htmlFor='lastName'
         className='text-sm font-medium text-neutral-700'
        >
         Last Name
        </Label>
        <div className='relative'>
         <User className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400' />
         <Input
          id='lastName'
          name='lastName'
          type='text'
          value={formData.lastName}
          onChange={handleChange}
          placeholder='Enter your last name'
          className='input-primary pl-10'
          required
         />
        </div>
       </div>
      </div>

      <div className='space-y-2'>
       <Label
        htmlFor='username'
        className='text-sm font-medium text-neutral-700'
       >
        Username
       </Label>
       <div className='relative'>
        <User className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400' />
        <Input
         id='username'
         name='username'
         type='text'
         value={formData.username}
         onChange={handleChange}
         placeholder='Choose a username'
         className='input-primary pl-10'
         required
        />
       </div>
      </div>

      <div className='space-y-2'>
       <Label htmlFor='email' className='text-sm font-medium text-neutral-700'>
        Email Address
       </Label>
       <div className='relative'>
        <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400' />
        <Input
         id='email'
         name='email'
         type='email'
         value={formData.email}
         onChange={handleChange}
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
         name='password'
         type={showPassword ? 'text' : 'password'}
         value={formData.password}
         onChange={handleChange}
         placeholder='Create a password'
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
        Confirm Password
       </Label>
       <div className='relative'>
        <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400' />
        <Input
         id='confirmPassword'
         name='confirmPassword'
         type={showConfirmPassword ? 'text' : 'password'}
         value={formData.confirmPassword}
         onChange={handleChange}
         placeholder='Confirm your password'
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
         Creating Account...
        </>
       ) : (
        <>
         Create Account
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

     {/* Login Link */}
     <div className='text-center'>
      <p className='text-neutral-600 text-sm'>
       Already have an account?{' '}
       <Link
        href='/auth/login'
        className='font-medium text-primary-600 hover:text-primary-700 transition-colors'
       >
        Sign in here
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
       <CheckCircle className='h-6 w-6 text-accent-green-600' />
      </div>
      <h3 className='font-medium text-neutral-900 mb-1'>Easy to Use</h3>
      <p className='text-sm text-neutral-600'>
       Intuitive interface & powerful features
      </p>
     </div>
    </div>
   </div>
  </div>
 );
}
