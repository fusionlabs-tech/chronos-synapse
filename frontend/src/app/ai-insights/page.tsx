'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Job, AIAnalysisResult } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AIInsightsContent() {
 const searchParams = useSearchParams();
 const [jobs, setJobs] = useState<Job[]>([]);
 const [selectedJob, setSelectedJob] = useState<Job | null>(null);
 const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
 const [loading, setLoading] = useState(false);
 const [analyzing, setAnalyzing] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const { showToast } = useToast();

 useEffect(() => {
  fetchJobs();
 }, []);

 // Auto-select job if jobId is provided in URL
 useEffect(() => {
  const jobId = searchParams.get('jobId');
  if (jobId && jobs.length > 0) {
   const job = jobs.find((j) => j.id === jobId);
   if (job) {
    setSelectedJob(job);
   }
  }
 }, [searchParams, jobs]);

 const fetchJobs = async () => {
  try {
   setLoading(true);
   const response = await apiClient.getJobs();
   setJobs(response.jobs);
  } catch (error) {
   console.error('Failed to fetch jobs:', error);
   showToast('Failed to load jobs', 'error');
  } finally {
   setLoading(false);
  }
 };

 const performAnalysis = async (jobId: string) => {
  try {
   setAnalyzing(true);
   const analysis = await apiClient.performComprehensiveAnalysis(jobId);
   setAiAnalysis(analysis);
   showToast('AI analysis completed successfully!', 'success');
  } catch (error) {
   console.error('AI analysis failed:', error);
   showToast('AI analysis failed. Please try again.', 'error');
  } finally {
   setAnalyzing(false);
  }
 };

 // Filter jobs based on search query
 const filteredJobs = useMemo(() => {
  if (!searchQuery.trim()) return jobs;

  const query = searchQuery.toLowerCase();
  return jobs.filter(
   (job) =>
    job.name.toLowerCase().includes(query) ||
    job.description?.toLowerCase().includes(query) ||
    job.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
    job.schedule.toLowerCase().includes(query)
  );
 }, [jobs, searchQuery]);

 const getSeverityColor = (severity: string) => {
  switch (severity) {
   case 'high':
    return 'text-red-600 bg-red-50 border-red-200';
   case 'medium':
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
   case 'low':
    return 'text-green-600 bg-green-50 border-green-200';
   default:
    return 'text-neutral-600 bg-neutral-50 border-neutral-200';
  }
 };

 const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
 };

 const getJobType = (job: Job) => {
  const command = job.command.toLowerCase();
  if (command.includes('backup') || command.includes('dump')) return 'backup';
  if (command.includes('clean') || command.includes('cleanup'))
   return 'cleanup';
  if (command.includes('health') || command.includes('check'))
   return 'monitoring';
  if (command.includes('sync') || command.includes('rsync')) return 'sync';
  if (command.includes('curl') || command.includes('wget')) return 'api';
  if (command.includes('report') || command.includes('report'))
   return 'reporting';
  return 'general';
 };

 const getJobTypeIcon = (type: string) => {
  switch (type) {
   case 'backup':
    return '💾';
   case 'cleanup':
    return '🧹';
   case 'monitoring':
    return '📊';
   case 'sync':
    return '🔄';
   case 'api':
    return '🌐';
   case 'reporting':
    return '📋';
   default:
    return '⚙️';
  }
 };

 if (loading) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='loading-spinner h-12 w-12'></div>
   </div>
  );
 }

 return (
  <div className='max-w-7xl mx-auto space-y-8'>
   {/* Page Header */}
   <div className='text-center space-y-4'>
    <div className='page-header-icon'>
     <span className='text-3xl'>🤖</span>
    </div>
    <div>
     <h1 className='page-header-title'>AI Insights</h1>
     <p className='text-neutral-600 mt-2 text-lg'>
      Get intelligent analysis and recommendations for your cron jobs
     </p>
    </div>
   </div>

   <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
    {/* Job Selection */}
    <div className='lg:col-span-1'>
     <Card className='card-primary'>
      <CardHeader>
       <CardTitle className='text-xl font-semibold text-neutral-900'>
        Select Job
       </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
       {/* Search */}
       <div>
        <input
         type='text'
         placeholder='Search jobs...'
         value={searchQuery}
         onChange={(e) => setSearchQuery(e.target.value)}
         className='input-primary w-full'
        />
       </div>

       {/* Job List */}
       <div className='space-y-3 max-h-96 overflow-y-auto'>
        {filteredJobs.length === 0 ? (
         <div className='text-center py-8 text-neutral-500'>
          <span className='text-2xl mb-2 block'>🔍</span>
          <p>No jobs found</p>
         </div>
        ) : (
         filteredJobs.map((job) => {
          const jobType = getJobType(job);
          const isSelected = selectedJob?.id === job.id;

          return (
           <div
            key={job.id}
            onClick={() => setSelectedJob(job)}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
             isSelected
              ? 'border-primary-300 bg-primary-50 shadow-md'
              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
           >
            <div className='flex items-start justify-between'>
             <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
               <span className='text-lg'>{getJobTypeIcon(jobType)}</span>
               <h3 className='font-medium text-neutral-900 truncate'>
                {job.name}
               </h3>
              </div>
              <p className='text-sm text-neutral-600 mb-2'>{job.schedule}</p>
              {job.tags && job.tags.length > 0 && (
               <div className='flex flex-wrap gap-1'>
                {job.tags.slice(0, 2).map((tag, index) => (
                 <span
                  key={index}
                  className='px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full'
                 >
                  {tag}
                 </span>
                ))}
                {job.tags.length > 2 && (
                 <span className='px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full'>
                  +{job.tags.length - 2}
                 </span>
                )}
               </div>
              )}
             </div>
             <div
              className={`w-3 h-3 rounded-full ${
               job.enabled ? 'bg-accent-green-500' : 'bg-neutral-300'
              }`}
             ></div>
            </div>
           </div>
          );
         })
        )}
       </div>
      </CardContent>
     </Card>
    </div>

    {/* Analysis Results */}
    <div className='lg:col-span-2'>
     {selectedJob ? (
      <div className='space-y-6'>
       {/* Job Info */}
       <Card className='card-primary'>
        <CardContent className='p-6'>
         <div className='flex items-start justify-between mb-4'>
          <div>
           <h2 className='text-2xl font-bold text-neutral-900 mb-2'>
            {selectedJob.name}
           </h2>
           <p className='text-neutral-600'>{selectedJob.description}</p>
          </div>
          <div className='flex items-center gap-2'>
           <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
             selectedJob.enabled ? 'badge-success' : 'badge-error'
            }`}
           >
            {selectedJob.enabled ? 'Active' : 'Disabled'}
           </span>
          </div>
         </div>

         <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='p-4 bg-neutral-50 rounded-lg'>
           <div className='text-sm text-neutral-500 mb-1'>Schedule</div>
           <div className='font-medium text-neutral-900'>
            {selectedJob.schedule}
           </div>
          </div>
          <div className='p-4 bg-neutral-50 rounded-lg'>
           <div className='text-sm text-neutral-500 mb-1'>Command</div>
           <div className='font-mono text-sm text-neutral-900 truncate'>
            {selectedJob.command}
           </div>
          </div>
          <div className='p-4 bg-neutral-50 rounded-lg'>
           <div className='text-sm text-neutral-500 mb-1'>Type</div>
           <div className='font-medium text-neutral-900 capitalize'>
            {getJobType(selectedJob)}
           </div>
          </div>
         </div>

         <Button
          onClick={() => performAnalysis(selectedJob.id)}
          disabled={analyzing}
          className='btn-primary w-full py-3'
         >
          {analyzing ? (
           <>
            <div className='loading-spinner h-5 w-5 mr-2'></div>
            Analyzing...
           </>
          ) : (
           <>
            <span className='text-xl mr-2'>🤖</span>
            Analyze with AI
           </>
          )}
         </Button>
        </CardContent>
       </Card>

       {/* Analysis Results */}
       {aiAnalysis && (
        <div className='space-y-6'>
         {/* Anomaly Detection */}
         {aiAnalysis.anomalyDetection && (
          <Card className='card-primary'>
           <CardContent className='p-6'>
            <div className='flex items-center space-x-3 mb-4'>
             <div className='icon-container-red'>
              <span className='text-xl'>🚨</span>
             </div>
             <div>
              <h3 className='text-lg font-semibold text-neutral-900'>
               Anomaly Detection
              </h3>
              <p className='text-sm text-neutral-600'>
               AI-powered anomaly detection and analysis
              </p>
             </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
             <div className='space-y-3'>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Anomaly Detected:</span>
               <span
                className={`font-medium ${
                 aiAnalysis.anomalyDetection.isAnomaly
                  ? 'text-red-600'
                  : 'text-green-600'
                }`}
               >
                {aiAnalysis.anomalyDetection.isAnomaly ? 'Yes' : 'No'}
               </span>
              </div>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Confidence:</span>
               <span
                className={`font-medium ${getConfidenceColor(
                 aiAnalysis.anomalyDetection.confidence
                )}`}
               >
                {(aiAnalysis.anomalyDetection.confidence * 100).toFixed(1)}%
               </span>
              </div>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Severity:</span>
               <span
                className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(
                 aiAnalysis.anomalyDetection.severity
                )}`}
               >
                {aiAnalysis.anomalyDetection.severity.toUpperCase()}
               </span>
              </div>
             </div>

             <div>
              <h4 className='font-medium text-neutral-900 mb-2'>Reason:</h4>
              <p className='text-sm text-neutral-600 mb-3'>
               {aiAnalysis.anomalyDetection.reason}
              </p>

              <h4 className='font-medium text-neutral-900 mb-2'>
               Suggestions:
              </h4>
              <ul className='space-y-1'>
               {aiAnalysis.anomalyDetection.suggestions.map(
                (suggestion, index) => (
                 <li
                  key={index}
                  className='text-sm text-neutral-600 flex items-start'
                 >
                  <span className='text-accent-blue-500 mr-2'>•</span>
                  {suggestion}
                 </li>
                )
               )}
              </ul>
             </div>
            </div>
           </CardContent>
          </Card>
         )}

         {/* Predictive Scheduling */}
         {aiAnalysis.predictiveSchedule && (
          <Card className='card-primary'>
           <CardContent className='p-6'>
            <div className='flex items-center space-x-3 mb-4'>
             <div className='icon-container-blue'>
              <span className='text-xl'>📅</span>
             </div>
             <div>
              <h3 className='text-lg font-semibold text-neutral-900'>
               Predictive Scheduling
              </h3>
              <p className='text-sm text-neutral-600'>
               AI-suggested optimal execution schedule
              </p>
             </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
             <div className='space-y-3'>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Current Schedule:</span>
               <span className='font-mono text-sm bg-neutral-100 px-2 py-1 rounded'>
                {selectedJob.schedule}
               </span>
              </div>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Suggested Schedule:</span>
               <span className='font-mono text-sm bg-accent-blue-100 px-2 py-1 rounded text-accent-blue-700'>
                {aiAnalysis.predictiveSchedule.suggestedSchedule}
               </span>
              </div>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Confidence:</span>
               <span
                className={`font-medium ${getConfidenceColor(
                 aiAnalysis.predictiveSchedule.confidence
                )}`}
               >
                {(aiAnalysis.predictiveSchedule.confidence * 100).toFixed(1)}%
               </span>
              </div>
             </div>

             <div>
              <h4 className='font-medium text-neutral-900 mb-2'>Reasoning:</h4>
              <p className='text-sm text-neutral-600 mb-3'>
               {aiAnalysis.predictiveSchedule.reasoning}
              </p>

              <h4 className='font-medium text-neutral-900 mb-2'>
               Expected Improvement:
              </h4>
              <p className='text-sm text-neutral-600'>
               {aiAnalysis.predictiveSchedule.expectedImprovement}
              </p>
             </div>
            </div>
           </CardContent>
          </Card>
         )}

         {/* Smart Retry Logic */}
         {aiAnalysis.smartRetry && (
          <Card className='card-primary'>
           <CardContent className='p-6'>
            <div className='flex items-center space-x-3 mb-4'>
             <div className='icon-container-yellow'>
              <span className='text-xl'>🔄</span>
             </div>
             <div>
              <h3 className='text-lg font-semibold text-neutral-900'>
               Smart Retry Logic
              </h3>
              <p className='text-sm text-neutral-600'>
               AI-powered retry strategy optimization
              </p>
             </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
             <div className='space-y-3'>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Should Retry:</span>
               <span
                className={`font-medium ${
                 aiAnalysis.smartRetry.shouldRetry
                  ? 'text-green-600'
                  : 'text-red-600'
                }`}
               >
                {aiAnalysis.smartRetry.shouldRetry ? 'Yes' : 'No'}
               </span>
              </div>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Retry Delay:</span>
               <span className='font-medium text-neutral-900'>
                {aiAnalysis.smartRetry.retryDelay}ms
               </span>
              </div>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Max Retries:</span>
               <span className='font-medium text-neutral-900'>
                {aiAnalysis.smartRetry.maxRetries}
               </span>
              </div>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Strategy:</span>
               <span className='font-medium text-neutral-900 capitalize'>
                {aiAnalysis.smartRetry.strategy.replace('_', ' ')}
               </span>
              </div>
             </div>

             <div>
              <h4 className='font-medium text-neutral-900 mb-2'>Reasoning:</h4>
              <p className='text-sm text-neutral-600'>
               {aiAnalysis.smartRetry.reasoning}
              </p>
             </div>
            </div>
           </CardContent>
          </Card>
         )}

         {/* Performance Optimization */}
         {aiAnalysis.performanceOptimization && (
          <Card className='card-primary'>
           <CardContent className='p-6'>
            <div className='flex items-center space-x-3 mb-4'>
             <div className='icon-container-green'>
              <span className='text-xl'>⚡</span>
             </div>
             <div>
              <h3 className='text-lg font-semibold text-neutral-900'>
               Performance Optimization
              </h3>
              <p className='text-sm text-neutral-600'>
               AI recommendations for job efficiency
              </p>
             </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
             <div className='space-y-3'>
              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Performance Score:</span>
               <span
                className={`font-medium ${
                 aiAnalysis.performanceOptimization.score >= 80
                  ? 'text-green-600'
                  : aiAnalysis.performanceOptimization.score >= 60
                  ? 'text-yellow-600'
                  : 'text-red-600'
                }`}
               >
                {aiAnalysis.performanceOptimization.score}/100
               </span>
              </div>

              <div className='flex items-center justify-between'>
               <span className='text-neutral-600'>Estimated Improvement:</span>
               <span className='font-medium text-green-600'>
                {aiAnalysis.performanceOptimization.estimatedImprovement}
               </span>
              </div>
             </div>

             <div className='space-y-4'>
              {aiAnalysis.performanceOptimization.issues.length > 0 && (
               <div>
                <h4 className='font-medium text-neutral-900 mb-2'>
                 Issues Identified:
                </h4>
                <ul className='space-y-1'>
                 {aiAnalysis.performanceOptimization.issues.map(
                  (issue, index) => (
                   <li
                    key={index}
                    className='text-sm text-red-600 flex items-start'
                   >
                    <span className='text-red-500 mr-2'>•</span>
                    {issue}
                   </li>
                  )
                 )}
                </ul>
               </div>
              )}

              <div>
               <h4 className='font-medium text-neutral-900 mb-2'>
                Optimization Suggestions:
               </h4>
               <ul className='space-y-1'>
                {aiAnalysis.performanceOptimization.suggestions.map(
                 (suggestion, index) => (
                  <li
                   key={index}
                   className='text-sm text-neutral-600 flex items-start'
                  >
                   <span className='text-accent-blue-500 mr-2'>•</span>
                   {suggestion}
                  </li>
                 )
                )}
               </ul>
              </div>
             </div>
            </div>
           </CardContent>
          </Card>
         )}
        </div>
       )}
      </div>
     ) : (
      <Card className='card-primary'>
       <CardContent className='p-12 text-center'>
        <div className='w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4'>
         <span className='text-2xl'>🤖</span>
        </div>
        <h3 className='text-lg font-medium text-neutral-900 mb-2'>
         Select a Job
        </h3>
        <p className='text-neutral-600'>
         Choose a job from the list to start AI analysis
        </p>
       </CardContent>
      </Card>
     )}
    </div>
   </div>
  </div>
 );
}

// Loading component for Suspense fallback
function AIInsightsLoading() {
 return (
  <div className='max-w-7xl mx-auto space-y-8'>
   <div className='text-center space-y-4'>
    <div className='page-header-icon'>
     <span className='text-3xl'>🤖</span>
    </div>
    <div>
     <h1 className='page-header-title'>AI Insights</h1>
     <p className='text-neutral-600 mt-2 text-lg'>
      Get intelligent analysis and recommendations for your cron jobs
     </p>
    </div>
   </div>

   <div className='flex items-center justify-center h-64'>
    <div className='loading-spinner h-12 w-12'></div>
   </div>
  </div>
 );
}

export default function AIInsightsPage() {
 return (
  <Suspense fallback={<AIInsightsLoading />}>
   <AIInsightsContent />
  </Suspense>
 );
}
