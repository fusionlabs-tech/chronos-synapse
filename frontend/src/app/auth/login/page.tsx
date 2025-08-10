'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import {
 ArrowRight,
 Shield,
 Zap,
 Github,
 Clock,
 Cpu,
 Database,
 Globe,
 Brain,
 Activity,
} from 'lucide-react';

export default function LoginPage() {
 const [loading, setLoading] = useState(false);
 const { loginWithGoogle, loginWithGitHub } = useAuth();
 const { showToast } = useToast();

 const handleGoogleLogin = async () => {
  setLoading(true);
  try {
   loginWithGoogle();
  } catch (error) {
   console.error('Google login error:', error);
   showToast('Failed to initiate Google login', 'error');
   setLoading(false);
  }
 };

 const handleGitHubLogin = async () => {
  setLoading(true);
  try {
   loginWithGitHub();
  } catch (error) {
   console.error('GitHub login error:', error);
   showToast('Failed to initiate GitHub login', 'error');
   setLoading(false);
  }
 };

 return (
  <div className='min-h-screen relative overflow-hidden bg-white'>
   {/* Animated Background Elements */}
   <div className='absolute inset-0'>
    {/* Grid Pattern */}
    <div className='absolute inset-0 opacity-[0.03]'>
     <div
      className='absolute inset-0'
      style={{
       backgroundImage: `radial-gradient(circle at 1px 1px, rgba(168, 85, 247, 0.3) 1px, transparent 0)`,
       backgroundSize: '40px 40px',
      }}
     ></div>
    </div>

    {/* Floating Circles */}
    <div
     className='absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/60 to-pink-400/60 rounded-full blur-lg'
     style={{
      animation: 'float 6s ease-in-out infinite',
      animationDelay: '0s',
     }}
    ></div>
    <div
     className='absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-400/60 to-pink-400/60 rounded-full blur-lg'
     style={{
      animation: 'float 6s ease-in-out infinite',
      animationDelay: '2s',
     }}
    ></div>
    <div
     className='absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-purple-400/60 to-pink-400/60 rounded-full blur-lg'
     style={{
      animation: 'float 6s ease-in-out infinite',
      animationDelay: '4s',
     }}
    ></div>
    <div
     className='absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-purple-400/60 to-pink-400/60 rounded-full blur-lg'
     style={{
      animation: 'float 6s ease-in-out infinite',
      animationDelay: '1s',
     }}
    ></div>

    {/* Floating Geometric Shapes */}
    <div
     className='absolute top-1/4 left-1/3 w-16 h-16 bg-gradient-to-br from-purple-500/70 to-pink-500/70 rotate-45'
     style={{
      animation: 'bounce 4s ease-in-out infinite',
      animationDelay: '0.5s',
     }}
    ></div>
    <div
     className='absolute top-1/3 right-1/4 w-12 h-12 bg-gradient-to-br from-purple-500/70 to-pink-500/70 rounded-full'
     style={{
      animation: 'bounce 4s ease-in-out infinite',
      animationDelay: '1.5s',
     }}
    ></div>
    <div
     className='absolute bottom-1/4 left-1/5 w-20 h-20 bg-gradient-to-br from-purple-500/70 to-pink-500/70 rotate-12'
     style={{
      animation: 'bounce 4s ease-in-out infinite',
      animationDelay: '2.5s',
     }}
    ></div>

    {/* Additional Background Art */}
    <div
     className='absolute top-1/2 left-1/6 w-8 h-8 bg-gradient-to-br from-blue-400/50 to-purple-400/50 rounded-full'
     style={{
      animation: 'float 8s ease-in-out infinite',
      animationDelay: '3s',
     }}
    ></div>
    <div
     className='absolute top-1/3 left-1/2 w-6 h-6 bg-gradient-to-br from-pink-400/50 to-purple-400/50 rotate-45'
     style={{
      animation: 'bounce 5s ease-in-out infinite',
      animationDelay: '2s',
     }}
    ></div>
    <div
     className='absolute bottom-1/3 right-1/6 w-10 h-10 bg-gradient-to-br from-purple-400/50 to-blue-400/50 rounded-full'
     style={{
      animation: 'float 7s ease-in-out infinite',
      animationDelay: '1.5s',
     }}
    ></div>

    {/* Neural Network Lines */}
    <div className='absolute inset-0 opacity-[0.02]'>
     <svg className='w-full h-full' viewBox='0 0 1000 1000'>
      <defs>
       <linearGradient id='neuralGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stopColor='rgba(168, 85, 247, 0.3)' />
        <stop offset='100%' stopColor='rgba(236, 72, 153, 0.3)' />
       </linearGradient>
      </defs>
      <path
       d='M100,200 Q300,100 500,200 T900,200'
       stroke='url(#neuralGradient)'
       strokeWidth='1'
       fill='none'
       style={{ animation: 'pulse 4s ease-in-out infinite' }}
      />
      <path
       d='M100,400 Q300,300 500,400 T900,400'
       stroke='url(#neuralGradient)'
       strokeWidth='1'
       fill='none'
       style={{
        animation: 'pulse 4s ease-in-out infinite',
        animationDelay: '1s',
       }}
      />
      <path
       d='M100,600 Q300,500 500,600 T900,600'
       stroke='url(#neuralGradient)'
       strokeWidth='1'
       fill='none'
       style={{
        animation: 'pulse 4s ease-in-out infinite',
        animationDelay: '2s',
       }}
      />
     </svg>
    </div>
   </div>

   {/* Main Content */}
   <div className='relative z-10 min-h-screen flex items-center justify-center p-4'>
    <div className='w-full max-w-md'>
     {/* Logo and Header */}
     <div className='text-center mb-8'>
      {/* Combined Logo with Text */}
      <div className='flex items-center justify-center gap-4 mb-3'>
       <div className='relative w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg'>
        <div className='relative'>
         {/* Clock face */}
         <div className='w-7 h-7 rounded-full border-2 border-white/80 relative'>
          {/* Clock hands */}
          <div className='absolute top-1/2 left-1/2 w-0.5 h-2.5 bg-white transform -translate-x-1/2 -translate-y-full origin-bottom rotate-45'></div>
          <div className='absolute top-1/2 left-1/2 w-0.5 h-2 bg-white transform -translate-x-1/2 -translate-y-full origin-bottom rotate-90'></div>
          {/* Center dot */}
          <div className='absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2'></div>
         </div>

         {/* AI/Neural network elements */}
         <div className='absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center'>
          <Brain className='w-1.5 h-1.5 text-white' />
         </div>
         <div className='absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center'>
          <Activity className='w-1 h-1 text-white' />
         </div>
        </div>
       </div>
       <span className='text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight font-poppins'>
        Chronos
       </span>
      </div>

      <p className='text-neutral-600 text-lg font-medium'>
       AI-Powered Cron Job Management
      </p>
      <p className='text-neutral-500 text-sm mt-2'>
       Intelligent automation for the modern developer
      </p>
     </div>

     {/* OAuth Login Form */}
     <div className='backdrop-blur-sm bg-white/70 rounded-2xl p-8 shadow-xl border border-white/20'>
      <div className='space-y-6'>
       {/* Google Login Button */}
       <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        className='w-full bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-3 py-4 px-6 rounded-xl shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md'
       >
        <svg className='w-5 h-5' viewBox='0 0 24 24'>
         <path
          fill='#4285F4'
          d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
         />
         <path
          fill='#34A853'
          d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
         />
         <path
          fill='#FBBC05'
          d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
         />
         <path
          fill='#EA4335'
          d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
         />
        </svg>
        <span className='font-semibold'>Continue with Google</span>
       </Button>

       {/* GitHub Login Button */}
       <Button
        onClick={handleGitHubLogin}
        disabled={loading}
        className='w-full bg-gray-900 text-white hover:bg-gray-800 flex items-center justify-center gap-3 py-4 px-6 rounded-xl shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md'
       >
        <Github className='w-5 h-5' />
        <span className='font-semibold'>Continue with GitHub</span>
       </Button>

       {/* Divider */}
       <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
         <span className='w-full border-t border-gray-200' />
        </div>
        <div className='relative flex justify-center text-sm'>
         <span className='px-4 bg-white/70 backdrop-blur-sm text-gray-500 font-medium'>
          Secure OAuth Authentication
         </span>
        </div>
       </div>

       {/* Features Grid */}
       <div className='grid grid-cols-2 gap-4 pt-4'>
        <div className='flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-purple-100/50'>
         <div className='p-2 bg-purple-100 rounded-lg'>
          <Shield className='w-4 h-4 text-purple-600' />
         </div>
         <div>
          <p className='text-sm font-semibold text-neutral-700'>
           Enterprise Security
          </p>
          <p className='text-xs text-neutral-500'>Bank-grade protection</p>
         </div>
        </div>

        <div className='flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-purple-100/50'>
         <div className='p-2 bg-purple-100 rounded-lg'>
          <Brain className='w-4 h-4 text-purple-600' />
         </div>
         <div>
          <p className='text-sm font-semibold text-neutral-700'>AI-Powered</p>
          <p className='text-xs text-neutral-500'>Smart automation</p>
         </div>
        </div>

        <div className='flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-purple-100/50'>
         <div className='p-2 bg-purple-100 rounded-lg'>
          <Clock className='w-4 h-4 text-purple-600' />
         </div>
         <div>
          <p className='text-sm font-semibold text-neutral-700'>
           Real-time Monitoring
          </p>
          <p className='text-xs text-neutral-500'>Live job tracking</p>
         </div>
        </div>

        <div className='flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-purple-100/50'>
         <div className='p-2 bg-purple-100 rounded-lg'>
          <Database className='w-4 h-4 text-purple-600' />
         </div>
         <div>
          <p className='text-sm font-semibold text-neutral-700'>
           Scalable Infrastructure
          </p>
          <p className='text-xs text-neutral-500'>Cloud-native</p>
         </div>
        </div>
       </div>

       {/* Trust Indicators */}
       <div className='text-center pt-4'>
        <div className='flex items-center justify-center gap-6 text-xs text-neutral-500'>
         <div className='flex items-center gap-1'>
          <Globe className='w-3 h-3' />
          <span>99.9% Uptime</span>
         </div>
         <div className='flex items-center gap-1'>
          <Shield className='w-3 h-3' />
          <span>SOC 2 Compliant</span>
         </div>
         <div className='flex items-center gap-1'>
          <Zap className='w-3 h-3' />
          <span>Global CDN</span>
         </div>
        </div>
       </div>
      </div>
     </div>

     {/* Footer */}
     <div className='text-center mt-6'>
      <p className='text-sm text-neutral-500'>
       By signing in, you agree to our{' '}
       <a
        href='#'
        className='text-purple-600 hover:text-purple-500 font-medium'
       >
        Terms of Service
       </a>{' '}
       and{' '}
       <a
        href='#'
        className='text-purple-600 hover:text-purple-500 font-medium'
       >
        Privacy Policy
       </a>
      </p>
     </div>
    </div>
   </div>

   {/* Custom CSS for animations */}
   <style jsx>{`
    @keyframes float {
     0%,
     100% {
      transform: translateY(0px);
     }
     50% {
      transform: translateY(-20px);
     }
    }
    @keyframes bounce {
     0%,
     100% {
      transform: translateY(0px);
     }
     50% {
      transform: translateY(-10px);
     }
    }
    @keyframes pulse {
     0%,
     100% {
      opacity: 0.3;
     }
     50% {
      opacity: 0.6;
     }
    }
   `}</style>
  </div>
 );
}
