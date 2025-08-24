'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
 Clock,
 TrendingUp,
 Shield,
 Zap,
 BarChart3,
 CheckCircle,
 ArrowRight,
 Code,
 Github,
 Star,
 Copy,
 Check,
 Key,
 BookOpen,
 ExternalLink,
 Package,
 Brain,
} from 'lucide-react';

const features = [
 {
  icon: Clock,
  title: 'Smart Job Scheduling',
  description: 'AI-powered cron job management with predictive scheduling and auto-recovery.',
  color: 'primary'
 },
 {
  icon: TrendingUp,
  title: 'Real-time Analytics',
  description: 'Live performance monitoring with detailed metrics and trend analysis.',
  color: 'blue'
 },
 {
  icon: Shield,
  title: 'Enterprise Security',
  description: 'Built-in authentication, API key management, and team collaboration.',
  color: 'green'
 },
 {
  icon: Zap,
  title: 'Lightning Fast',
  description: 'Redis Stack powered backend with sub-millisecond response times.',
  color: 'orange'
 },
 {
  icon: BarChart3,
  title: 'Telemetry First',
  description: 'Comprehensive execution tracking with error analysis and debugging.',
  color: 'yellow'
 },
 {
  icon: Brain,
  title: 'AI Insights',
  description: 'Intelligent error detection and performance optimization suggestions.',
  color: 'red'
 }
];

const benefits = [
 'Zero-configuration job registration',
 'Real-time execution monitoring',
 'Automatic failure recovery',
 'Team collaboration features',
 'Custom AI provider integration',
 'Production-ready deployment'
];

const codeExample = `import ChronosRunner from 'chronos-synapse-sdk';

const runner = new ChronosRunner({
  apiKey: process.env.CHRONOS_API_KEY!,
  captureConsole: true,
});

// Register your job
await runner['client'].registerJobs([
  {
    id: 'job:daily-report',
    name: 'Daily Report',
    schedule: '0 * * * *',
    runMode: 'recurring',
  },
]);

runner.register('job:daily-report', async () => {
  // Your work here
  await generateReports();
});

// Start listening for triggers
runner.start();`;

export default function HomePage() {
 const [mounted, setMounted] = useState(false);
 const [copied, setCopied] = useState(false);
 const [installCopied, setInstallCopied] = useState(false);

 useEffect(() => {
  setMounted(true);
 }, []);

 if (!mounted) {
  return (
   <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100'>
    <div className='text-center'>
     <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4'></div>
     <h1 className='text-2xl font-bold text-gray-900 mb-2'>Chronos</h1>
     <p className='text-gray-600'>Loading...</p>
    </div>
   </div>
  );
 }

 return (
  <div className='min-h-screen relative overflow-hidden bg-purple-50'>
   {/* Animated Background Elements */}
   <div className='absolute inset-0 pointer-events-none'>
    {/* Grid Pattern */}
    <div className='absolute inset-0 opacity-[0.02]'>
     <div
      className='absolute inset-0'
      style={{
       backgroundImage: `radial-gradient(circle at 1px 1px, rgba(168, 85, 247, 0.3) 1px, transparent 0)`,
       backgroundSize: '40px 40px',
      }}
     ></div>
    </div>

    {/* Floating Circles - Spread across entire viewport */}
    <div
     className='absolute top-[10%] left-[15%] w-32 h-32 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-xl'
     style={{
      animation: 'float 8s ease-in-out infinite',
      animationDelay: '0s',
     }}
    ></div>
    <div
     className='absolute top-[25%] left-[70%] w-24 h-24 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-xl'
     style={{
      animation: 'float 6s ease-in-out infinite',
      animationDelay: '2s',
     }}
    ></div>
    <div
     className='absolute top-[40%] left-[25%] w-36 h-36 bg-gradient-to-br from-pink-400/25 to-blue-400/25 rounded-full blur-xl'
     style={{
      animation: 'float 9s ease-in-out infinite',
      animationDelay: '3s',
     }}
    ></div>
    <div
     className='absolute top-[55%] left-[80%] w-28 h-28 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl'
     style={{
      animation: 'float 11s ease-in-out infinite',
      animationDelay: '1s',
     }}
    ></div>
    <div
     className='absolute top-[70%] left-[45%] w-30 h-30 bg-gradient-to-br from-blue-400/25 to-purple-400/25 rounded-full blur-xl'
     style={{
      animation: 'float 7s ease-in-out infinite',
      animationDelay: '4s',
     }}
    ></div>
    <div
     className='absolute top-[85%] left-[20%] w-26 h-26 bg-gradient-to-br from-pink-400/30 to-purple-400/30 rounded-full blur-xl'
     style={{
      animation: 'float 10s ease-in-out infinite',
      animationDelay: '5s',
     }}
    ></div>
    <div
     className='absolute top-[30%] left-[85%] w-22 h-22 bg-gradient-to-br from-purple-400/25 to-blue-400/25 rounded-full blur-xl'
     style={{
      animation: 'float 8s ease-in-out infinite',
      animationDelay: '2.5s',
     }}
    ></div>
    <div
     className='absolute top-[60%] left-[10%] w-28 h-28 bg-gradient-to-br from-blue-400/30 to-pink-400/30 rounded-full blur-xl'
     style={{
      animation: 'float 9s ease-in-out infinite',
      animationDelay: '1.5s',
     }}
    ></div>
    <div
     className='absolute top-[15%] left-[50%] w-20 h-20 bg-gradient-to-br from-pink-400/25 to-purple-400/25 rounded-full blur-xl'
     style={{
      animation: 'float 7s ease-in-out infinite',
      animationDelay: '6s',
     }}
    ></div>
    <div
     className='absolute top-[45%] left-[60%] w-34 h-34 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-xl'
     style={{
      animation: 'float 12s ease-in-out infinite',
      animationDelay: '3.5s',
     }}
    ></div>
    <div
     className='absolute top-[80%] left-[65%] w-24 h-24 bg-gradient-to-br from-blue-400/25 to-pink-400/25 rounded-full blur-xl'
     style={{
      animation: 'float 8s ease-in-out infinite',
      animationDelay: '4.5s',
     }}
    ></div>
    <div
     className='absolute top-[20%] left-[35%] w-18 h-18 bg-gradient-to-br from-pink-400/30 to-purple-400/30 rounded-full blur-xl'
     style={{
      animation: 'float 10s ease-in-out infinite',
      animationDelay: '2s',
     }}
    ></div>

    {/* Floating Geometric Shapes - Better distribution */}
    <div
     className='absolute top-[35%] left-[40%] w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rotate-45 rounded-lg'
     style={{
      animation: 'bounce 6s ease-in-out infinite',
      animationDelay: '0.5s',
     }}
    ></div>
    <div
     className='absolute top-[50%] left-[75%] w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full'
     style={{
      animation: 'bounce 5s ease-in-out infinite',
      animationDelay: '1.5s',
     }}
    ></div>
    <div
     className='absolute top-[65%] left-[30%] w-14 h-14 bg-gradient-to-br from-pink-500/15 to-blue-500/15 rotate-30 rounded-lg'
     style={{
      animation: 'bounce 7s ease-in-out infinite',
      animationDelay: '3s',
     }}
    ></div>
    <div
     className='absolute top-[25%] left-[75%] w-18 h-18 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rotate-60 rounded-lg'
     style={{
      animation: 'bounce 9s ease-in-out infinite',
      animationDelay: '4s',
     }}
    ></div>
    <div
     className='absolute top-[75%] left-[55%] w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rotate-12 rounded-lg'
     style={{
      animation: 'bounce 8s ease-in-out infinite',
      animationDelay: '2.5s',
     }}
    ></div>
    <div
     className='absolute top-[90%] left-[40%] w-10 h-10 bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-full'
     style={{
      animation: 'bounce 6s ease-in-out infinite',
      animationDelay: '5s',
     }}
    ></div>

    {/* Additional floating elements - scattered throughout middle areas */}
    <div
     className='absolute top-[35%] left-[55%] w-8 h-8 bg-gradient-to-br from-blue-400/25 to-purple-400/25 rounded-full'
     style={{
      animation: 'float 9s ease-in-out infinite',
      animationDelay: '3s',
     }}
    ></div>
    <div
     className='absolute top-[50%] left-[40%] w-6 h-6 bg-gradient-to-br from-pink-400/25 to-purple-400/25 rotate-45 rounded'
     style={{
      animation: 'bounce 7s ease-in-out infinite',
      animationDelay: '2s',
     }}
    ></div>
    <div
     className='absolute top-[65%] left-[70%] w-10 h-10 bg-gradient-to-br from-purple-400/25 to-blue-400/25 rounded-full'
     style={{
      animation: 'float 11s ease-in-out infinite',
      animationDelay: '1.5s',
     }}
    ></div>
    <div
     className='absolute top-[22%] left-[45%] w-7 h-7 bg-gradient-to-br from-pink-400/20 to-blue-400/20 rotate-30 rounded'
     style={{
      animation: 'bounce 8s ease-in-out infinite',
      animationDelay: '4.5s',
     }}
    ></div>
    <div
     className='absolute top-[85%] left-[35%] w-9 h-9 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full'
     style={{
      animation: 'float 10s ease-in-out infinite',
      animationDelay: '6s',
     }}
    ></div>
    <div
     className='absolute top-[40%] left-[20%] w-5 h-5 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rotate-60 rounded'
     style={{
      animation: 'bounce 5s ease-in-out infinite',
      animationDelay: '3.5s',
     }}
    ></div>

    {/* Neural Network Lines */}
    <div className='absolute inset-0 opacity-[0.03]'>
     <svg className='w-full h-full' viewBox='0 0 1000 1000'>
      <defs>
       <linearGradient id='neuralGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stopColor='rgba(168, 85, 247, 0.4)' />
        <stop offset='100%' stopColor='rgba(236, 72, 153, 0.4)' />
       </linearGradient>
      </defs>
      <path
       d='M100,200 Q300,100 500,200 T900,200'
       stroke='url(#neuralGradient)'
       strokeWidth='1'
       fill='none'
       style={{ animation: 'pulse 6s ease-in-out infinite' }}
      />
      <path
       d='M100,400 Q300,300 500,400 T900,400'
       stroke='url(#neuralGradient)'
       strokeWidth='1'
       fill='none'
       style={{
        animation: 'pulse 6s ease-in-out infinite',
        animationDelay: '2s',
       }}
      />
      <path
       d='M100,600 Q300,500 500,600 T900,600'
       stroke='url(#neuralGradient)'
       strokeWidth='1'
       fill='none'
       style={{
        animation: 'pulse 6s ease-in-out infinite',
        animationDelay: '4s',
       }}
      />
     </svg>
    </div>
   </div>

   {/* Navigation */}
   <nav className='relative z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200'>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
     <div className='flex justify-between items-center h-16'>
      <div className='flex items-center space-x-2'>
       <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center'>
        <Clock className='w-5 h-5 text-white' />
       </div>
       <span className='text-xl font-bold gradient-text-primary'>Chronos</span>
      </div>
      <div className='flex items-center space-x-4'>
       <Link
        href='#documentation'
        className='text-gray-600 hover:text-gray-900 transition-colors font-medium'
       >
        Docs
       </Link>
       <Link
        href='/auth/login'
        className='btn-secondary px-4 py-2 rounded-lg'
       >
        Sign In
       </Link>
      </div>
     </div>
    </div>
   </nav>

   {/* Hero Section */}
   <section className='pt-16 pb-20 bg-gradient-to-br from-gray-50 via-white to-purple-50'>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
     <div className='text-center pt-16 pb-16'>
      <div className='inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8'>
       <Star className='w-4 h-4' />
       <span>AI-Powered Job Management Platform</span>
      </div>
      
      <h1 className='text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight'>
       Intelligent Cron
       <span className='block gradient-text-primary'>Management</span>
       <span className='block text-gray-600'>Made Simple</span>
      </h1>
      
      <p className='text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed'>
       Telemetry-first job analytics with real-time monitoring, AI insights, and team collaboration.
       Transform your scheduled jobs into intelligent, self-healing workflows.
      </p>
      
      <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
       <Link href='/auth/login'>
        <Button
         size='lg'
         className='btn-primary px-8 py-4 text-lg'
        >
         Start Free Trial
         <ArrowRight className='ml-2 w-5 h-5' />
        </Button>
       </Link>
       <Link href='https://github.com/fusionlabs-tech/chronos-synapse' target='_blank' rel='noopener noreferrer'>
        <Button
         size='lg'
         variant='outline'
         className='btn-secondary px-8 py-4 text-lg'
        >
         <Github className='mr-2 w-5 h-5' />
         View on GitHub
        </Button>
       </Link>
      </div>
     </div>
     
     {/* Hero Image/Demo */}
     <div className='relative max-w-5xl mx-auto'>
      <div className='relative overflow-hidden rounded-2xl shadow-2xl bg-gray-900'>
       <div className='absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20'></div>
       <div className='relative p-6'>
        <div className='flex items-center space-x-2 mb-4'>
         <div className='w-3 h-3 rounded-full bg-red-500'></div>
         <div className='w-3 h-3 rounded-full bg-yellow-500'></div>
         <div className='w-3 h-3 rounded-full bg-green-500'></div>
         <span className='ml-4 text-gray-400 text-sm'>chronos-dashboard.app</span>
        </div>
        <div className='bg-gray-800 rounded-lg p-4 text-sm font-mono text-green-400'>
         <div className='flex items-center space-x-2 mb-2'>
          <CheckCircle className='w-4 h-4 text-green-500' />
          <span className='text-gray-300'>daily-reports</span>
          <span className='text-green-400'>SUCCESS</span>
          <span className='text-gray-500'>2.3s</span>
         </div>
         <div className='flex items-center space-x-2 mb-2'>
          <CheckCircle className='w-4 h-4 text-green-500' />
          <span className='text-gray-300'>data-sync</span>
          <span className='text-green-400'>SUCCESS</span>
          <span className='text-gray-500'>1.1s</span>
         </div>
         <div className='flex items-center space-x-2'>
          <div className='w-4 h-4 rounded-full bg-blue-500 animate-pulse'></div>
          <span className='text-gray-300'>weekly-backup</span>
          <span className='text-blue-400'>RUNNING</span>
          <span className='text-gray-500'>45s</span>
         </div>
        </div>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Features Section */}
   <section className='py-20 bg-white'>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
     <div className='text-center mb-16'>
      <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
       Powerful Features for Modern Teams
      </h2>
      <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
       Everything you need to monitor, manage, and optimize your scheduled jobs in production.
      </p>
     </div>
     
     <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
      {features.map((feature, index) => {
       const Icon = feature.icon;
       return (
        <Card key={index} className='card-primary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'>
         <CardContent className='p-8'>
          <div className={`icon-container-${feature.color} w-12 h-12 mb-6`}>
           <Icon className='w-6 h-6' />
          </div>
          <h3 className='text-xl font-semibold text-gray-900 mb-3'>
           {feature.title}
          </h3>
          <p className='text-gray-600 leading-relaxed'>
           {feature.description}
          </p>
         </CardContent>
        </Card>
       );
      })}
     </div>
    </div>
   </section>

   {/* Code Example Section */}
   <section className='py-20 bg-gray-50'>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
     <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
      <div>
       <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-6'>
        Get Started in
        <span className='gradient-text-primary block'>Under 5 Minutes</span>
       </h2>
       <p className='text-lg text-gray-600 mb-8'>
        Install our SDK, register your jobs, and start receiving real-time analytics.
        No complex configuration required.
       </p>
       
       <div className='space-y-4 mb-8'>
        {benefits.map((benefit, index) => (
         <div key={index} className='flex items-center space-x-3'>
          <CheckCircle className='w-5 h-5 text-green-500 flex-shrink-0' />
          <span className='text-gray-700'>{benefit}</span>
         </div>
        ))}
       </div>
       
       <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
        <div className='flex items-center space-x-2 mb-2'>
         <Key className='w-4 h-4 text-blue-600' />
         <span className='text-sm font-medium text-blue-800'>Getting Started</span>
        </div>
        <p className='text-sm text-blue-700'>
         You'll need an API key after signing up to start sending job telemetry.
        </p>
       </div>
       
       <Link href='/auth/login'>
        <Button
         size='lg'
         className='btn-primary'
        >
         Try It Now
         <ArrowRight className='ml-2 w-5 h-5' />
        </Button>
       </Link>
      </div>
      
      <div className='relative'>
       <div className='absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl'></div>
       <Card className='relative overflow-hidden'>
        <CardContent className='p-0'>
         <div className='bg-gray-900 p-6'>
          <div className='flex items-center justify-between mb-4'>
           <div className='flex items-center space-x-2'>
            <Code className='w-5 h-5 text-green-400' />
            <span className='text-gray-300 font-medium'>Quick Start</span>
           </div>
           <Button
            size='sm'
            variant='outline'
            className='border-gray-600 text-gray-300 hover:bg-gray-800 h-8'
            onClick={() => {
             navigator.clipboard.writeText(codeExample);
             setCopied(true);
             setTimeout(() => setCopied(false), 2000);
            }}
           >
            {copied ? (
             <Check className='w-4 h-4' />
            ) : (
             <Copy className='w-4 h-4' />
            )}
           </Button>
          </div>
          <pre className='text-sm text-gray-300 overflow-x-auto'>
           <code>{codeExample}</code>
          </pre>
         </div>
        </CardContent>
       </Card>
      </div>
     </div>
    </div>
   </section>

   {/* Documentation Section */}
   <section id='documentation' className='py-20 bg-white'>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
     <div className='text-center mb-16'>
      <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
       Documentation & Resources
      </h2>
      <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
       Everything you need to get started and master Chronos Synapse.
      </p>
     </div>
     
     <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
      {/* SDK Package */}
      <Card className='card-primary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'>
       <CardContent className='p-8'>
        <div className='icon-container-green w-12 h-12 mb-6'>
         <Package className='w-6 h-6' />
        </div>
        <h3 className='text-xl font-semibold text-gray-900 mb-3'>
         NPM Package
        </h3>
        <p className='text-gray-600 leading-relaxed mb-6'>
         Install the official Chronos Synapse SDK for Node.js applications.
        </p>
        <div className='bg-gray-100 rounded-lg p-3 mb-4 flex items-center justify-between'>
         <code className='text-sm text-gray-800'>npm install chronos-synapse-sdk</code>
         <Button
          size='sm'
          variant='outline'
          className='h-8 px-2 border-gray-300 text-gray-600 hover:bg-gray-200'
          onClick={() => {
           navigator.clipboard.writeText('npm install chronos-synapse-sdk');
           setInstallCopied(true);
           setTimeout(() => setInstallCopied(false), 2000);
          }}
         >
          {installCopied ? (
           <Check className='w-4 h-4' />
          ) : (
           <Copy className='w-4 h-4' />
          )}
         </Button>
        </div>
        <Link 
         href='https://www.npmjs.com/package/chronos-synapse-sdk' 
         target='_blank' 
         rel='noopener noreferrer'
         className='inline-flex items-center text-green-600 hover:text-green-700 font-medium'
        >
         View on NPM
         <ExternalLink className='ml-1 w-4 h-4' />
        </Link>
       </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card className='card-primary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'>
       <CardContent className='p-8'>
        <div className='icon-container-blue w-12 h-12 mb-6'>
         <BookOpen className='w-6 h-6' />
        </div>
        <h3 className='text-xl font-semibold text-gray-900 mb-3'>
         Getting Started
        </h3>
        <p className='text-gray-600 leading-relaxed mb-6'>
         Step-by-step guide to integrate Chronos Synapse into your applications.
        </p>
        <ul className='text-sm text-gray-600 space-y-2 mb-6'>
         <li>• Installation & setup</li>
         <li>• API key configuration</li>
         <li>• Job registration examples</li>
         <li>• Dashboard walkthrough</li>
        </ul>
        <Link 
         href='https://github.com/fusionlabs-tech/chronos-synapse/blob/main/README.md' 
         target='_blank' 
         rel='noopener noreferrer'
         className='inline-flex items-center text-blue-600 hover:text-blue-700 font-medium'
        >
         Read Guide
         <ExternalLink className='ml-1 w-4 h-4' />
        </Link>
       </CardContent>
      </Card>

      {/* GitHub Repository */}
      <Card className='card-primary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'>
       <CardContent className='p-8'>
        <div className='icon-container-primary w-12 h-12 mb-6'>
         <Github className='w-6 h-6' />
        </div>
        <h3 className='text-xl font-semibold text-gray-900 mb-3'>
         Open Source
        </h3>
        <p className='text-gray-600 leading-relaxed mb-6'>
         Explore the source code, contribute, and see example implementations.
        </p>
        <ul className='text-sm text-gray-600 space-y-2 mb-6'>
         <li>• Full source code</li>
         <li>• Example projects</li>
         <li>• Issue tracking</li>
         <li>• Community discussions</li>
        </ul>
        <Link 
         href='https://github.com/fusionlabs-tech/chronos-synapse' 
         target='_blank' 
         rel='noopener noreferrer'
         className='inline-flex items-center text-purple-600 hover:text-purple-700 font-medium'
        >
         View Repository
         <ExternalLink className='ml-1 w-4 h-4' />
        </Link>
       </CardContent>
      </Card>
     </div>
    </div>
   </section>

   {/* CTA Section */}
   <section className='py-20 bg-gradient-to-br from-purple-600 to-pink-600'>
    <div className='max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8'>
     <h2 className='text-3xl md:text-4xl font-bold text-white mb-6'>
      Ready to Transform Your Job Management?
     </h2>
     <p className='text-xl text-purple-100 mb-10'>
      Join thousands of developers who trust Chronos for their mission-critical workflows.
     </p>
     <div className='flex flex-col sm:flex-row gap-4 justify-center'>
      <Link href='/auth/login'>
       <Button
        size='lg'
        className='bg-white text-purple-600 hover:bg-transparent hover:text-white hover:border-white hover:border-2 px-8 py-4 text-lg font-semibold transition-all duration-200 border-2 border-white'
       >
        Start Your Free Trial
       </Button>
      </Link>
      <Link href='mailto:anonx.shop@gmail.com?subject=Demo Request - Chronos Synapse'>
       <Button
        size='lg'
        variant='outline'
        className='border-white border-2 text-white bg-transparent hover:bg-white hover:text-purple-600 px-8 py-4 text-lg transition-all duration-200'
       >
        Schedule a Demo
       </Button>
      </Link>
     </div>
    </div>
   </section>

   {/* Footer */}
   <footer className='bg-gray-900 text-gray-300 py-12'>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
     <div className='flex flex-col md:flex-row justify-between items-center'>
      <div className='flex items-center space-x-2 mb-4 md:mb-0'>
       <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center'>
        <Clock className='w-5 h-5 text-white' />
       </div>
       <span className='text-xl font-bold text-white'>Chronos</span>
      </div>
      <div className='text-sm'>
       © {new Date().getFullYear()} Fusion Labs. All rights reserved.
      </div>
     </div>
    </div>
   </footer>

   {/* Custom CSS for animations */}
   <style jsx>{`
    @keyframes float {
     0%,
     100% {
      transform: translateY(0px) rotate(0deg);
     }
     50% {
      transform: translateY(-20px) rotate(5deg);
     }
    }
    @keyframes bounce {
     0%,
     100% {
      transform: translateY(0px) rotate(0deg);
     }
     50% {
      transform: translateY(-15px) rotate(10deg);
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
