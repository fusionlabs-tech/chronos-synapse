'use client';

import { useState, useEffect } from 'react';
import { Job, JobFormData } from '@/types';
import { apiClient } from '@/lib/api';
import { isValidCronExpression } from '@/lib/utils';
import { useToast } from '@/components/ui/toasts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
 Settings,
 Clock,
 RefreshCw,
 Tag,
 Globe,
 Save,
 X,
 Plus,
 Trash2,
} from 'lucide-react';

interface JobFormProps {
 job?: Job;
 fileContent?: { filename: string; content: string; updatedAt: string } | null;
 onSuccess?: () => void;
 onCancel?: () => void;
}

export function JobForm({
 job,
 fileContent,
 onSuccess,
 onCancel,
}: JobFormProps) {
 const { showToast } = useToast();
 const [formData, setFormData] = useState<JobFormData>({
  name: '',
  description: '',
  schedule: '',
  command: '',
  enabled: true,
  timeout: 300000, // 5 minutes default
  retries: 3,
  tags: [],
  environment: {},
  code: '',
  language: 'python',
  filename: 'main.py',
  allowNetwork: false,
 });

 const [errors, setErrors] = useState<Record<string, string>>({});
 const [loading, setLoading] = useState(false);
 const [newTag, setNewTag] = useState('');
 const [newEnvKey, setNewEnvKey] = useState('');
 const [newEnvValue, setNewEnvValue] = useState('');

 // Initialize form with job data if editing
 useEffect(() => {
  console.log('JobForm received job prop:', job);
  console.log('JobForm received fileContent prop:', fileContent);
  if (job) {
   const formDataToSet = {
    name: job.name,
    description: job.description || '',
    schedule: job.schedule,
    command: job.command,
    enabled: job.enabled,
    timeout: job.timeout,
    retries: job.retries,
    tags: job.tags || [],
    environment: job.environment || {},
    code: fileContent?.content || '',
    language: job.language || 'python',
    filename: fileContent?.filename || 'main.py',
    allowNetwork: job.allowNetwork ?? false,
   };
   console.log('Setting form data:', formDataToSet);
   setFormData(formDataToSet);
  }
 }, [job, fileContent]);

 const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.name.trim()) {
   newErrors.name = 'Job name is required';
  }

  if (!formData.schedule.trim()) {
   newErrors.schedule = 'Cron schedule is required';
  } else if (!isValidCronExpression(formData.schedule)) {
   newErrors.schedule = 'Invalid cron expression';
  }

  if (!formData.command.trim()) {
   newErrors.command = 'Command is required';
  }

  if (formData.timeout < 1000) {
   newErrors.timeout = 'Timeout must be at least 1 second';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
   return;
  }

  setLoading(true);
  try {
   if (job) {
    await apiClient.updateJob(job.id, formData);
   } else {
    await apiClient.createJob(formData);
   }
   onSuccess?.();
  } catch (error) {
   console.error('Failed to save job:', error);
   setErrors({ submit: 'Failed to save job. Please try again.' });
   showToast('Failed to save job. Please try again.', 'error');
  } finally {
   setLoading(false);
  }
 };

 const addTag = () => {
  if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
   setFormData((prev) => ({
    ...prev,
    tags: [...prev.tags, newTag.trim()],
   }));
   setNewTag('');
  }
 };

 const removeTag = (tagToRemove: string) => {
  setFormData((prev) => ({
   ...prev,
   tags: prev.tags.filter((tag) => tag !== tagToRemove),
  }));
 };

 const addEnvironmentVariable = () => {
  if (newEnvKey.trim() && newEnvValue.trim()) {
   setFormData((prev) => ({
    ...prev,
    environment: {
     ...prev.environment,
     [newEnvKey.trim()]: newEnvValue.trim(),
    },
   }));
   setNewEnvKey('');
   setNewEnvValue('');
  }
 };

 const removeEnvironmentVariable = (key: string) => {
  setFormData((prev) => {
   const newEnv = { ...prev.environment };
   delete newEnv[key];
   return { ...prev, environment: newEnv };
  });
 };

 return (
  <form onSubmit={handleSubmit} className='space-y-8'>
   {/* Basic Information */}
   <Card className='card-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='flex items-center gap-3 text-xl'>
      <div className='icon-container-primary'>
       <Settings className='h-5 w-5' />
      </div>
      Basic Information
     </CardTitle>
    </CardHeader>
    <CardContent className='space-y-6'>
     <div className='space-y-2'>
      <Label htmlFor='name' className='text-sm font-medium text-neutral-700'>
       Job Name *
      </Label>
      <Input
       type='text'
       id='name'
       value={formData.name}
       onChange={(e) =>
        setFormData((prev) => ({ ...prev, name: e.target.value }))
       }
       className={`input-primary ${
        errors.name
         ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
         : ''
       }`}
       placeholder='e.g., Daily Backup'
      />
      {errors.name && <p className='text-red-600 text-sm'>{errors.name}</p>}
     </div>

     <div className='space-y-2'>
      <Label
       htmlFor='description'
       className='text-sm font-medium text-neutral-700'
      >
       Description
      </Label>
      <Textarea
       id='description'
       value={formData.description}
       onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        setFormData((prev) => ({ ...prev, description: e.target.value }))
       }
       className='input-primary'
       rows={3}
       placeholder='Describe what this job does...'
      />
     </div>

     <div className='space-y-2'>
      <Label
       htmlFor='schedule'
       className='text-sm font-medium text-neutral-700'
      >
       Cron Schedule *
      </Label>
      <Input
       type='text'
       id='schedule'
       value={formData.schedule}
       onChange={(e) =>
        setFormData((prev) => ({ ...prev, schedule: e.target.value }))
       }
       className={`input-primary ${
        errors.schedule
         ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
         : ''
       }`}
       placeholder='0 2 * * * (every day at 2 AM)'
      />
      {errors.schedule && (
       <p className='text-red-600 text-sm'>{errors.schedule}</p>
      )}
      <p className='text-neutral-500 text-sm'>
       Format: minute hour day month weekday
      </p>
     </div>

     <div className='space-y-2'>
      <Label htmlFor='command' className='text-sm font-medium text-neutral-700'>
       Command *
      </Label>
      <Textarea
       id='command'
       value={formData.command}
       onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        setFormData((prev) => ({ ...prev, command: e.target.value }))
       }
       className={`input-primary ${
        errors.command
         ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
         : ''
       }`}
       rows={3}
       placeholder='e.g., /usr/bin/backup.sh'
      />
      {errors.command && (
       <p className='text-red-600 text-sm'>{errors.command}</p>
      )}
     </div>
    </CardContent>
   </Card>

   {/* Configuration */}
   <Card className='card-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='flex items-center gap-3 text-xl'>
      <div className='icon-container-blue'>
       <Clock className='h-5 w-5' />
      </div>
      Configuration
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='space-y-2'>
       <Label
        htmlFor='timeout'
        className='text-sm font-medium text-neutral-700'
       >
        Timeout (ms)
       </Label>
       <Input
        type='number'
        id='timeout'
        value={formData.timeout}
        onChange={(e) =>
         setFormData((prev) => ({
          ...prev,
          timeout: parseInt(e.target.value) || 0,
         }))
        }
        className={`input-primary ${
         errors.timeout
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : ''
        }`}
        min='1000'
        step='1000'
       />
       {errors.timeout && (
        <p className='text-red-600 text-sm'>{errors.timeout}</p>
       )}
      </div>

      <div className='space-y-2'>
       <Label
        htmlFor='retries'
        className='text-sm font-medium text-neutral-700'
       >
        Retries
       </Label>
       <Input
        type='number'
        id='retries'
        value={formData.retries}
        onChange={(e) =>
         setFormData((prev) => ({
          ...prev,
          retries: parseInt(e.target.value) || 0,
         }))
        }
        className={`input-primary ${
         errors.retries
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : ''
        }`}
        min='0'
        max='10'
       />
       {errors.retries && (
        <p className='text-red-600 text-sm'>{errors.retries}</p>
       )}
      </div>

      <div className='flex items-center space-x-3'>
       <input
        type='checkbox'
        id='enabled'
        checked={formData.enabled}
        onChange={(e) =>
         setFormData((prev) => ({ ...prev, enabled: e.target.checked }))
        }
        className='w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 bg-white/50'
       />
       <Label
        htmlFor='enabled'
        className='text-sm font-medium text-neutral-700'
       >
        Enabled
       </Label>
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Tags */}
   <Card className='card-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='flex items-center gap-3 text-xl'>
      <div className='icon-container-green'>
       <Tag className='h-5 w-5' />
      </div>
      Tags
     </CardTitle>
    </CardHeader>
    <CardContent className='space-y-4'>
     <div className='flex space-x-3'>
      <Input
       type='text'
       value={newTag}
       onChange={(e) => setNewTag(e.target.value)}
       className='input-primary flex-1'
       placeholder='Add a tag...'
       onKeyPress={(e: React.KeyboardEvent) =>
        e.key === 'Enter' && (e.preventDefault(), addTag())
       }
      />
      <Button type='button' onClick={addTag} className='btn-success'>
       <Plus className='h-4 w-4 mr-2' />
       Add
      </Button>
     </div>

     {formData.tags && formData.tags.length > 0 && (
      <div className='flex flex-wrap gap-2'>
       {formData.tags.map((tag) => (
        <span
         key={tag}
         className='inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200'
        >
         {tag}
         <button
          type='button'
          onClick={() => removeTag(tag)}
          className='ml-2 text-green-600 hover:text-green-800'
         >
          <X className='h-3 w-3' />
         </button>
        </span>
       ))}
      </div>
     )}
    </CardContent>
   </Card>

   {/* Environment Variables */}
   <Card className='card-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='flex items-center gap-3 text-xl'>
      <div className='icon-container-orange'>
       <Globe className='h-5 w-5' />
      </div>
      Environment Variables
     </CardTitle>
    </CardHeader>
    <CardContent className='space-y-4'>
     <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
      <Input
       type='text'
       value={newEnvKey}
       onChange={(e) => setNewEnvKey(e.target.value)}
       className='input-primary'
       placeholder='Variable name'
      />
      <Input
       type='text'
       value={newEnvValue}
       onChange={(e) => setNewEnvValue(e.target.value)}
       className='input-primary'
       placeholder='Variable value'
      />
      <Button
       type='button'
       onClick={addEnvironmentVariable}
       className='btn-danger'
      >
       <Plus className='h-4 w-4 mr-2' />
       Add
      </Button>
     </div>

     {formData.environment && Object.keys(formData.environment).length > 0 && (
      <div className='space-y-3'>
       {Object.entries(formData.environment).map(([key, value]) => (
        <div
         key={key}
         className='flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200'
        >
         <div className='flex items-center space-x-2'>
          <span className='font-medium text-neutral-900'>{key}</span>
          <span className='text-neutral-500'>=</span>
          <span className='text-neutral-700 font-mono bg-neutral-100 px-2 py-1 rounded'>
           {value}
          </span>
         </div>
         <Button
          type='button'
          onClick={() => removeEnvironmentVariable(key)}
          variant='outline'
          size='sm'
          className='text-red-600 hover:text-red-800 border-red-200 hover:border-red-300'
         >
          <Trash2 className='h-4 w-4' />
         </Button>
        </div>
       ))}
      </div>
     )}
    </CardContent>
   </Card>

   {/* Submit Error */}
   {errors.submit && (
    <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
     <p className='text-red-600'>{errors.submit}</p>
    </div>
   )}

   {/* Network toggle disclaimer */}
   <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4'>
    <p className='text-amber-800 text-sm'>
     Network access is disabled by default for security. Enable “Allow network
     egress” only for trusted jobs. No runtime package installation is allowed;
     use language built-ins (e.g., Node https, Python urllib) or images with
     built-in tools.
    </p>
   </div>

   {/* Actions */}
   <div className='flex justify-end space-x-4'>
    <Button
     type='button'
     onClick={onCancel}
     variant='outline'
     className='btn-secondary'
    >
     Cancel
    </Button>
    <Button type='submit' disabled={loading} className='btn-primary'>
     {loading ? (
      <>
       <div className='loading-spinner h-4 w-4 mr-2'></div>
       Saving...
      </>
     ) : (
      <>
       <Save className='h-4 w-4 mr-2' />
       {job ? 'Update Job' : 'Create Job'}
      </>
     )}
    </Button>
   </div>
  </form>
 );
}
