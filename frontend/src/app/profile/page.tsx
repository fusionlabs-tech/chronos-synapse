'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { User } from '@/types';
import { useToast } from '@/components/ui/toasts';
import { Calendar, Crown, Brain, Plus, Key, Settings, Globe, Zap, Trash2, Save, Shield } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Simple brand icons (inline SVG) for OAuth providers
function OAuthIcon({ provider }: { provider?: 'GOOGLE' | 'GITHUB' }) {
 const p = (provider || 'GOOGLE').toUpperCase() as 'GOOGLE' | 'GITHUB';
 if (p === 'GITHUB') {
  return (
   <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='currentColor'
    aria-label='GitHub'
    className='text-neutral-900'
   >
    <path d='M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.31 1.23a11.5 11.5 0 0 1 6.02 0c2.3-1.55 3.31-1.23 3.31-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 12 .5Z' />
   </svg>
  );
 }
 // Google "G" mark
 return (
  <svg
   width='18'
   height='18'
   viewBox='0 0 48 48'
   aria-label='Google'
   className='block'
  >
   <path
    fill='#FFC107'
    d='M43.6 20.5H42V20H24v8h11.3C34.9 32.6 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6.1 29.7 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 18.5-8.9 18.5-20c0-1.1-.1-2.2-.3-3.5z'
   />
   <path
    fill='#FF3D00'
    d='M6.3 14.7l6.6 4.8C14.6 15.6 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6.1 29.7 4 24 4 15.6 4 8.3 8.7 6.3 14.7z'
   />
   <path
    fill='#4CAF50'
    d='M24 44c5.8 0 10.9-2.2 14.7-5.8l-6.8-5.6C29.9 34.9 27.1 36 24 36c-6 0-10.9-3.4-13.2-8.3l-6.6 5.1C8.4 39.1 15.6 44 24 44z'
   />
   <path
    fill='#1976D2'
    d='M43.6 20.5H42V20H24v8h11.3c-1 3.1-3.5 5.6-6.7 6.6l6.8 5.6C38.4 37.9 42 31.8 42 24c0-1.1-.1-2.2-.4-3.5z'
   />
  </svg>
 );
}

export default function ProfilePage() {
 const { user, updateUser } = useAuth();
 const { showToast } = useToast();
 const [loading, setLoading] = useState(false);
 const [editing, setEditing] = useState(false);
 const [aiKeys, setAiKeys] = useState<any[]>([]);
 const [aiModalOpen, setAiModalOpen] = useState(false);
 const [aiForm, setAiForm] = useState({
  provider: 'OPENAI',
  alias: '',
  apiKey: '',
  defaultModel: '',
  endpointBase: '',
  orgId: '',
 });

 // Helper functions for better UX
 const getModelPlaceholder = (provider: string) => {
  switch (provider) {
   case 'OPENAI': return 'e.g., gpt-4, gpt-3.5-turbo';
   case 'ANTHROPIC': return 'e.g., claude-3-5-sonnet-20241022';
   case 'GOOGLE': return 'e.g., gemini-pro, gemini-1.5-pro';
   case 'AZURE_OPENAI': return 'e.g., gpt-4, gpt-35-turbo';
   default: return 'Model name';
  }
 };

 const getEndpointPlaceholder = (provider: string) => {
  switch (provider) {
   case 'OPENAI': return 'https://api.openai.com/v1';
   case 'ANTHROPIC': return 'https://api.anthropic.com';
   case 'GOOGLE': return 'https://generativelanguage.googleapis.com';
   case 'AZURE_OPENAI': return 'https://your-resource.openai.azure.com';
   default: return 'https://api.your-provider.com';
  }
 };

 // Helpers
 const formatDateTime = (iso?: string) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Never';
  return d.toLocaleString(undefined, {
   year: 'numeric',
   month: 'short',
   day: '2-digit',
   hour: '2-digit',
   minute: '2-digit',
  });
 };

 // Load AI keys
 useEffect(() => {
  const loadAi = async () => {
   try {
    const res: any = await apiClient.getAiKeys();
    const keys = (res?.keys || []) as any[];
    setAiKeys(keys);
   } catch (e) {
    setAiKeys([]);
   }
  };
  if (user) void loadAi();
 }, [user]);

 const handleCreateAiKey = async () => {
  try {
   if (!aiForm.apiKey || !aiForm.provider) {
    showToast('Provider and API key are required', 'warning');
    return;
   }
   await apiClient.createAiKey({
    provider: aiForm.provider,
    alias: aiForm.alias || undefined,
    apiKey: aiForm.apiKey,
    defaultModel: aiForm.defaultModel || undefined,
    endpointBase: aiForm.endpointBase || undefined,
    orgId: aiForm.orgId || undefined,
   });
   setAiModalOpen(false);
   setAiForm({
    provider: 'OPENAI',
    alias: '',
    apiKey: '',
    defaultModel: '',
    endpointBase: '',
    orgId: '',
   });
   const res: any = await apiClient.getAiKeys();
   setAiKeys(res?.keys || []);
   showToast('AI provider added', 'success');
  } catch (e: any) {
   showToast('Failed to add AI provider', 'error');
  }
 };

 const handleDeleteAiKey = async (id: string) => {
  try {
   await apiClient.deleteAiKey(id);
   setAiKeys((prev) => prev.filter((k) => k.id !== id));
   showToast('AI provider removed', 'success');
  } catch {
   showToast('Failed to remove AI provider', 'error');
  }
 };

 const handleTestAiKey = async (id: string) => {
  try {
   const res = await apiClient.testAiKey(id);
   if ((res as any)?.ok) showToast('AI provider key looks good', 'success');
   else showToast('AI provider test failed', 'error');
  } catch {
   showToast('AI provider test failed', 'error');
  }
 };

 // Profile form state
 const [profileData, setProfileData] = useState({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
 });

 useEffect(() => {
  if (user) {
   setProfileData({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    username: user.username || '',
    email: user.email || '',
   });
  }
 }, [user]);

 const handleProfileUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
   const updatedUser = await apiClient.updateProfile(profileData);
   updateUser(updatedUser);
   setEditing(false);
   showToast('Profile updated successfully', 'success');
  } catch (error) {
   console.error('Failed to update profile:', error);
   showToast('Failed to update profile', 'error');
  } finally {
   setLoading(false);
  }
 };

 if (!user) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='loading-spinner h-12 w-12'></div>
   </div>
  );
 }

 return (
  <div className='max-w-6xl mx-auto space-y-8'>
   {/* Page Header */}
   <div className='text-center space-y-2'>
    <h1 className='page-header-title'>Profile</h1>
    <p className='text-neutral-600 text-lg'>Manage your account and security</p>
   </div>

   <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
    {/* Profile Information */}
    <div className='lg:col-span-2 space-y-6'>
     <Card className='card-primary'>
      <CardHeader className='pb-6'>
       <CardTitle className='text-xl'>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
       {editing ? (
        <form onSubmit={handleProfileUpdate} className='space-y-6'>
         <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
           <Label
            htmlFor='firstName'
            className='text-sm font-medium text-neutral-700'
           >
            First Name
           </Label>
           <Input
            id='firstName'
            value={profileData.firstName}
            onChange={(e) =>
             setProfileData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            className='input-primary'
            required
           />
          </div>
          <div className='space-y-2'>
           <Label
            htmlFor='lastName'
            className='text-sm font-medium text-neutral-700'
           >
            Last Name
           </Label>
           <Input
            id='lastName'
            value={profileData.lastName}
            onChange={(e) =>
             setProfileData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            className='input-primary'
            required
           />
          </div>
         </div>

         <div className='space-y-2'>
          <Label
           htmlFor='username'
           className='text-sm font-medium text-neutral-700'
          >
           Username
          </Label>
          <Input
           id='username'
           value={profileData.username}
           onChange={(e) =>
            setProfileData((prev) => ({ ...prev, username: e.target.value }))
           }
           className='input-primary'
           required
          />
         </div>

         <div className='space-y-2'>
          <Label
           htmlFor='email'
           className='text-sm font-medium text-neutral-700'
          >
           Email
          </Label>
          <Input
           id='email'
           type='email'
           value={profileData.email}
           onChange={(e) =>
            setProfileData((prev) => ({ ...prev, email: e.target.value }))
           }
           className='input-primary'
           required
          />
         </div>

         <div className='flex gap-3 pt-4'>
          <Button type='submit' disabled={loading} className='btn-primary'>
           {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
           type='button'
           variant='outline'
           onClick={() => setEditing(false)}
           disabled={loading}
           className='btn-secondary'
          >
           Cancel
          </Button>
         </div>
        </form>
       ) : (
        <div className='space-y-6'>
         <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
           <Label className='text-sm font-medium text-neutral-500'>
            First Name
           </Label>
           <p className='text-lg font-medium text-neutral-900'>
            {user.firstName || 'Not set'}
           </p>
          </div>
          <div className='space-y-2'>
           <Label className='text-sm font-medium text-neutral-500'>
            Last Name
           </Label>
           <p className='text-lg font-medium text-neutral-900'>
            {user.lastName || 'Not set'}
           </p>
          </div>
         </div>

         <div className='space-y-2'>
          <Label className='text-sm font-medium text-neutral-500'>
           Username
          </Label>
          <p className='text-lg font-medium text-neutral-900'>
           {user.username}
          </p>
         </div>

         <div className='space-y-2'>
          <Label className='text-sm font-medium text-neutral-500'>Email</Label>
          <p className='text-lg font-medium text-neutral-900'>{user.email}</p>
         </div>

         <Button onClick={() => setEditing(true)} className='btn-primary'>
          Edit Profile
         </Button>
        </div>
       )}
      </CardContent>
     </Card>

     {/* AI Providers */}
     <Card className='card-primary'>
      <CardHeader className='pb-6'>
       <div className='flex items-center justify-between'>
        <div>
         <CardTitle className='text-xl flex items-center gap-2'>
          <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center'>
           <Brain className='w-4 h-4 text-white' />
          </div>
          AI Providers (BYOK)
         </CardTitle>
         <p className='text-sm text-neutral-600 mt-1'>
          Bring your own AI keys for enhanced analysis and insights
         </p>
        </div>
        <Button
         onClick={() => setAiModalOpen(true)}
         className='btn-primary'
        >
         <Plus className='w-4 h-4 mr-2' />
         Add Provider
        </Button>
       </div>
      </CardHeader>
      <CardContent>
       {aiKeys.length === 0 ? (
        <div className='text-center py-8'>
         <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <Brain className='w-8 h-8 text-purple-500' />
         </div>
         <h3 className='text-lg font-medium text-neutral-900 mb-2'>
          No AI Providers Added
         </h3>
         <p className='text-neutral-600 mb-4 max-w-md mx-auto'>
          Add your AI provider keys to enable intelligent job analysis,
          anomaly detection, and performance optimization.
         </p>
         <Button
          onClick={() => setAiModalOpen(true)}
          className='btn-primary'
         >
          <Plus className='w-4 h-4 mr-2' />
          Add Your First Provider
         </Button>
        </div>
       ) : (
        <div className='space-y-4'>
         {aiKeys.map((k) => (
          <div
           key={k.id}
           className='border border-neutral-200 rounded-lg p-4 hover:border-purple-300 transition-colors'
          >
           <div className='flex items-start justify-between'>
            <div className='flex items-start gap-3'>
             <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              k.provider === 'OPENAI' ? 'bg-green-100' :
              k.provider === 'ANTHROPIC' ? 'bg-orange-100' :
              k.provider === 'GOOGLE' ? 'bg-blue-100' :
              k.provider === 'AZURE_OPENAI' ? 'bg-blue-100' :
              'bg-gray-100'
             }`}>
              <Brain className={`w-5 h-5 ${
               k.provider === 'OPENAI' ? 'text-green-600' :
               k.provider === 'ANTHROPIC' ? 'text-orange-600' :
               k.provider === 'GOOGLE' ? 'text-blue-600' :
               k.provider === 'AZURE_OPENAI' ? 'text-blue-600' :
               'text-gray-600'
              }`} />
             </div>
             <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1'>
               <h4 className='font-medium text-neutral-900'>
                {k.provider}
               </h4>
               {k.alias && (
                <Badge variant='outline' className='text-xs'>
                 {k.alias}
                </Badge>
               )}
               <Badge className={k.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {k.isActive ? 'Active' : 'Inactive'}
               </Badge>
              </div>
              <div className='text-sm text-neutral-600 space-y-1'>
               <div className='flex items-center gap-2'>
                <Key className='w-3 h-3' />
                <span className='font-mono text-xs'>{k.maskedKey}</span>
               </div>
               {k.defaultModel && (
                <div className='flex items-center gap-2'>
                 <Settings className='w-3 h-3' />
                 <span>Model: {k.defaultModel}</span>
                </div>
               )}
               {k.endpointBase && (
                <div className='flex items-center gap-2'>
                 <Globe className='w-3 h-3' />
                 <span className='truncate'>Endpoint: {k.endpointBase}</span>
                </div>
               )}
              </div>
             </div>
            </div>
            <div className='flex gap-2'>
             <Button
              variant='outline'
              size='sm'
              onClick={() => handleTestAiKey(k.id)}
              className='text-blue-600 border-blue-200 hover:bg-blue-50'
             >
              <Zap className='w-3 h-3 mr-1' />
              Test
             </Button>
             <Button
              variant='outline'
              size='sm'
              onClick={() => handleDeleteAiKey(k.id)}
              className='text-red-600 border-red-200 hover:bg-red-50'
             >
              <Trash2 className='w-3 h-3 mr-1' />
              Delete
             </Button>
            </div>
           </div>
          </div>
         ))}
        </div>
       )}

       {aiModalOpen && (
        <div className='mt-6 border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50'>
         <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center'>
           <Plus className='w-5 h-5 text-white' />
          </div>
          <div>
           <h3 className='text-lg font-medium text-neutral-900'>Add AI Provider</h3>
           <p className='text-sm text-neutral-600'>Configure your AI provider for intelligent analysis</p>
          </div>
         </div>
         
         <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
           <Label className='text-sm font-medium text-neutral-700 mb-2 block'>Provider</Label>
           <Select
            value={aiForm.provider}
            onChange={(e) =>
             setAiForm((p) => ({
              ...p,
              provider: (e.target as HTMLSelectElement).value,
             }))
            }
            className='w-full'
           >
            <option value='OPENAI'>OpenAI (GPT-4, GPT-3.5)</option>
            <option value='ANTHROPIC'>Anthropic (Claude)</option>
            <option value='GOOGLE'>Google (Gemini)</option>
            <option value='AZURE_OPENAI'>Azure OpenAI</option>
            <option value='CUSTOM'>Custom Provider</option>
           </Select>
          </div>
          
          <div>
           <Label className='text-sm font-medium text-neutral-700 mb-2 block'>Alias (optional)</Label>
           <Input
            value={aiForm.alias}
            onChange={(e) =>
             setAiForm((p) => ({ ...p, alias: e.target.value }))
            }
            placeholder='e.g., "Production API" or "Team Key"'
            className='input-primary'
           />
          </div>
          
          <div className='md:col-span-2'>
           <Label className='text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2'>
            <Key className='w-4 h-4' />
            API Key
           </Label>
           <Input
            type='password'
            value={aiForm.apiKey}
            onChange={(e) =>
             setAiForm((p) => ({ ...p, apiKey: e.target.value }))
            }
            placeholder='Enter your API key'
            className='input-primary font-mono'
           />
          </div>
          
          <div>
           <Label className='text-sm font-medium text-neutral-700 mb-2 block'>Default Model</Label>
           <Input
            value={aiForm.defaultModel}
            onChange={(e) =>
             setAiForm((p) => ({ ...p, defaultModel: e.target.value }))
            }
            placeholder={getModelPlaceholder(aiForm.provider)}
            className='input-primary'
           />
          </div>
          
          <div>
           <Label className='text-sm font-medium text-neutral-700 mb-2 block'>Endpoint Base (optional)</Label>
           <Input
            value={aiForm.endpointBase}
            onChange={(e) =>
             setAiForm((p) => ({ ...p, endpointBase: e.target.value }))
            }
            placeholder={getEndpointPlaceholder(aiForm.provider)}
            className='input-primary font-mono text-xs'
           />
          </div>
          
          <div className='md:col-span-2'>
           <Label className='text-sm font-medium text-neutral-700 mb-2 block'>Organization/Project ID (optional)</Label>
           <Input
            value={aiForm.orgId}
            onChange={(e) =>
             setAiForm((p) => ({ ...p, orgId: e.target.value }))
            }
            placeholder='Organization or project identifier'
            className='input-primary'
           />
          </div>
         </div>
         
         <div className='mt-6 flex gap-3'>
          <Button 
           variant='outline' 
           onClick={() => setAiModalOpen(false)}
           className='flex-1 md:flex-none'
          >
           Cancel
          </Button>
          <Button 
           onClick={handleCreateAiKey}
           disabled={!aiForm.apiKey || !aiForm.provider}
           className='btn-primary flex-1 md:flex-none'
          >
           <Save className='w-4 h-4 mr-2' />
           Save Provider
          </Button>
         </div>
         
         <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='flex gap-3'>
           <Shield className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
           <div>
            <h4 className='text-sm font-medium text-blue-900 mb-1'>Security Information</h4>
            <ul className='text-xs text-blue-700 space-y-1'>
             <li>• Your API key is encrypted using AES-256-GCM before storage</li>
             <li>• Keys are only decrypted when needed for AI analysis</li>
             <li>• We never log or store the decrypted keys</li>
             <li>• You can revoke access at any time by deleting the provider</li>
            </ul>
           </div>
          </div>
         </div>
        </div>
       )}
      </CardContent>
     </Card>

     {/* Security Settings */}
     <Card className='card-primary'>
      <CardHeader className='pb-6'>
       <CardTitle className='text-xl'>Account Security</CardTitle>
      </CardHeader>
      <CardContent>
       <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Authentication Method */}
        <div className='space-y-2'>
         <Label className='text-sm font-medium text-neutral-500'>
          Authentication Method
         </Label>
         <div className='flex items-center gap-3'>
          <div className='w-2 h-2 bg-accent-green-500 rounded-full'></div>
          <div className='flex items-center gap-2'>
           <OAuthIcon provider={user.oauthProvider} />
           <span className='text-sm text-neutral-600'>
            {user.oauthProvider || 'GOOGLE'}
           </span>
          </div>
         </div>
        </div>
        {/* Account Status */}
        <div className='space-y-2'>
         <Label className='text-sm font-medium text-neutral-500'>
          Account Status
         </Label>
         <div className='flex items-center gap-2'>
          <div
           className={`w-2 h-2 rounded-full ${
            user.isActive ? 'bg-accent-green-500' : 'bg-neutral-400'
           }`}
          ></div>
          <p className='text-lg font-medium text-neutral-900'>
           {user.isActive ? 'Active' : 'Inactive'}
          </p>
         </div>
        </div>
        {/* Email Verification */}
        <div className='space-y-2'>
         <Label className='text-sm font-medium text-neutral-500'>
          Email Verification
         </Label>
         <div className='flex items-center gap-2'>
          {user.emailVerified ? (
           <>
            <div className='w-2 h-2 bg-accent-green-500 rounded-full'></div>
            <p className='text-lg font-medium text-accent-green-600'>
             Verified
            </p>
           </>
          ) : (
           <>
            <div className='w-2 h-2 bg-accent-orange-500 rounded-full'></div>
            <p className='text-lg font-medium text-accent-orange-600'>
             Not Verified
            </p>
           </>
          )}
         </div>
        </div>
        {/* Last Login */}
        <div className='space-y-2'>
         <Label className='text-sm font-medium text-neutral-500'>
          Last Login
         </Label>
         <div className='flex items-center gap-2'>
          <Calendar className='w-4 h-4 text-neutral-400' />
          <p className='text-lg font-medium text-neutral-900'>
           {formatDateTime(user.lastLoginAt)}
          </p>
         </div>
        </div>
       </div>

       <div className='pt-4 mt-4 border-t border-neutral-200'>
        <p className='text-sm text-neutral-500'>
         Your account is secured through OAuth authentication. To change your
         password or security settings, please visit your OAuth provider's
         account settings.
        </p>
       </div>

       <div className='pt-4 mt-4 border-t border-neutral-200'>
        <h4 className='font-semibold text-neutral-900 mb-3'>
         Security Recommendations
        </h4>
        <ul className='space-y-2 text-sm text-neutral-600'>
         <li className='flex items-center gap-2'>
          <div className='w-1.5 h-1.5 bg-accent-green-500 rounded-full'></div>
          Enable two-factor authentication on your OAuth provider account
         </li>
         <li className='flex items-center gap-2'>
          <div className='w-1.5 h-1.5 bg-accent-green-500 rounded-full'></div>
          Regularly review and revoke unused application access
         </li>
         <li className='flex items-center gap-2'>
          <div className='w-1.5 h-1.5 bg-accent-green-500 rounded-full'></div>
          Keep your OAuth provider account credentials secure
         </li>
         <li className='flex items-center gap-2'>
          <div className='w-1.5 h-1.5 bg-accent-green-500 rounded-full'></div>
          Monitor your account activity for suspicious login attempts
         </li>
        </ul>
       </div>
      </CardContent>
     </Card>
    </div>

    {/* Sidebar */}
    <div className='space-y-6'>
     {/* Account Status */}
     <Card className='card-gradient-blue'>
      <CardHeader className='pb-4'>
       <CardTitle className='text-lg'>Account Status</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
       <div className='flex items-center justify-between'>
        <span className='text-sm text-neutral-600'>Status</span>
        <span className='badge-success'>Active</span>
       </div>
       <div className='flex items-center justify-between'>
        <span className='text-sm text-neutral-600'>Role</span>
        <div className='flex items-center gap-1'>
         {user.role === 'ADMIN' && (
          <Crown className='h-3 w-3 text-accent-yellow-500' />
         )}
         <span className='text-sm font-medium text-neutral-900 capitalize'>
          {user.role}
         </span>
        </div>
       </div>
       <div className='flex items-center justify-between'>
        <span className='text-sm text-neutral-600'>Member Since</span>
        <span className='text-sm font-medium text-neutral-900'>
         {new Date(user.createdAt).toLocaleDateString()}
        </span>
       </div>
      </CardContent>
     </Card>

     {/* Quick Actions */}
     <Card className='card-primary'>
      <CardHeader className='pb-4'>
       <CardTitle className='text-lg'>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
       <Button
        variant='outline'
        className='btn-secondary w-full justify-start'
        onClick={() => (window.location.href = '/api-keys')}
       >
        Manage API Keys
       </Button>
       {user.role === 'ADMIN' && (
        <Button
         variant='outline'
         className='btn-secondary w-full justify-start'
         onClick={() => (window.location.href = '/dashboard/admin')}
        >
         Admin Dashboard
        </Button>
       )}
      </CardContent>
     </Card>
    </div>
   </div>
  </div>
 );
}
