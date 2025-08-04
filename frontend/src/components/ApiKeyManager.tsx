'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
 Key,
 Plus,
 Copy,
 Trash2,
 Eye,
 EyeOff,
 Activity,
 Shield,
 CheckCircle,
 AlertTriangle,
 Lock,
} from 'lucide-react';

interface ApiKey {
 id: string;
 name: string;
 key: string;
 permissions: string[];
 isActive: boolean;
 createdAt: string;
 lastUsedAt?: string;
}

export default function ApiKeyManager() {
 const { showToast } = useToast();
 const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
 const [loading, setLoading] = useState(true);
 const [creating, setCreating] = useState(false);
 const [showNewKey, setShowNewKey] = useState<string | null>(null);
 const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
 const [newKeyName, setNewKeyName] = useState('');
 const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);

 useEffect(() => {
  fetchApiKeys();
 }, []);

 const fetchApiKeys = async () => {
  try {
   setLoading(true);
   const response = await apiClient.getApiKeys();
   setApiKeys(response.keys);
  } catch (error) {
   console.error('Failed to fetch API keys:', error);
   showToast('Failed to load API keys', 'error');
  } finally {
   setLoading(false);
  }
 };

 const handleCreateApiKey = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newKeyName.trim()) {
   showToast('Please enter a key name', 'error');
   return;
  }

  setCreating(true);
  try {
   const response = await apiClient.createApiKey(newKeyName, newKeyPermissions);
   setShowNewKey(response.key);
   setNewKeyName('');
   setNewKeyPermissions([]);
   await fetchApiKeys();
   showToast('API key created successfully', 'success');
  } catch (error) {
   console.error('Failed to create API key:', error);
   showToast('Failed to create API key', 'error');
  } finally {
   setCreating(false);
  }
 };

 const handleDeleteApiKey = async (apiKeyId: string) => {
  if (
   !confirm(
    'Are you sure you want to delete this API key? This action cannot be undone.'
   )
  ) {
   return;
  }

  try {
   await apiClient.deleteApiKey(apiKeyId);
   await fetchApiKeys();
   showToast('API key deleted successfully', 'success');
  } catch (error) {
   console.error('Failed to delete API key:', error);
   showToast('Failed to delete API key', 'error');
  }
 };

 const copyToClipboard = async (text: string) => {
  try {
   await navigator.clipboard.writeText(text);
   showToast('Copied to clipboard', 'success');
  } catch (error) {
   console.error('Failed to copy to clipboard:', error);
   showToast('Failed to copy to clipboard', 'error');
  }
 };

 const toggleKeyVisibility = (keyId: string) => {
  const newShowKeys = new Set(showKeys);
  if (newShowKeys.has(keyId)) {
   newShowKeys.delete(keyId);
  } else {
   newShowKeys.add(keyId);
  }
  setShowKeys(newShowKeys);
 };

 const availablePermissions = [
  { id: 'jobs:read', label: 'Read Jobs', description: 'View and list jobs' },
  {
   id: 'jobs:write',
   label: 'Create Jobs',
   description: 'Create and update jobs',
  },
  { id: 'jobs:delete', label: 'Delete Jobs', description: 'Delete jobs' },
  {
   id: 'executions:read',
   label: 'Read Executions',
   description: 'View job executions',
  },
  {
   id: 'analytics:read',
   label: 'Read Analytics',
   description: 'Access analytics data',
  },
 ];

 const togglePermission = (permission: string) => {
  setNewKeyPermissions((prev) =>
   prev.includes(permission)
    ? prev.filter((p) => p !== permission)
    : [...prev, permission]
  );
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
     <Key className='h-10 w-10 text-white' />
    </div>
    <div>
     <h1 className='page-header-title'>API Key Management</h1>
     <p className='text-neutral-600 mt-2 text-lg'>
      Create and manage API keys for programmatic access to Chronos Synapse
     </p>
    </div>
   </div>

   <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
    {/* Main Content */}
    <div className='lg:col-span-2 space-y-6'>
     {/* Create New API Key */}
     <Card className='card-gradient-primary'>
      <CardHeader className='pb-6'>
       <CardTitle className='flex items-center gap-3 text-xl'>
        <div className='icon-container-primary'>
         <Plus className='h-5 w-5' />
        </div>
        Create New API Key
       </CardTitle>
      </CardHeader>
      <CardContent>
       <form onSubmit={handleCreateApiKey} className='space-y-6'>
        <div className='space-y-2'>
         <Label
          htmlFor='keyName'
          className='text-sm font-medium text-neutral-700'
         >
          Key Name
         </Label>
         <Input
          id='keyName'
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder='e.g., Production API Key'
          className='input-primary'
          required
         />
        </div>

        <div className='space-y-3'>
         <Label className='text-sm font-medium text-neutral-700'>
          Permissions
         </Label>
         <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {availablePermissions.map((permission) => (
           <label
            key={permission.id}
            className='flex items-start space-x-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors'
           >
            <input
             type='checkbox'
             checked={newKeyPermissions.includes(permission.id)}
             onChange={() => togglePermission(permission.id)}
             className='mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded'
            />
            <div className='flex-1'>
             <div className='text-sm font-medium text-neutral-900'>
              {permission.label}
             </div>
             <div className='text-xs text-neutral-500'>
              {permission.description}
             </div>
            </div>
           </label>
          ))}
         </div>
        </div>

        <Button
         type='submit'
         disabled={creating || !newKeyName.trim()}
         className='btn-primary flex items-center gap-2'
        >
         <Key className='h-4 w-4' />
         {creating ? 'Creating...' : 'Create API Key'}
        </Button>
       </form>
      </CardContent>
     </Card>

     {/* API Keys List */}
     <Card className='card-primary'>
      <CardHeader className='pb-6'>
       <CardTitle className='flex items-center gap-3 text-xl'>
        <div className='icon-container-blue'>
         <Shield className='h-5 w-5' />
        </div>
        Your API Keys ({apiKeys.length})
       </CardTitle>
      </CardHeader>
      <CardContent>
       {apiKeys.length === 0 ? (
        <div className='text-center py-12'>
         <div className='w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4'>
          <Key className='h-8 w-8 text-neutral-400' />
         </div>
         <h3 className='text-lg font-medium text-neutral-900 mb-2'>
          No API Keys Yet
         </h3>
         <p className='text-neutral-600'>
          Create your first API key to get started with programmatic access.
         </p>
        </div>
       ) : (
        <div className='space-y-4'>
         {apiKeys.map((apiKey) => (
          <div
           key={apiKey.id}
           className='p-6 border border-neutral-200 rounded-xl bg-white hover:shadow-md transition-all duration-200'
          >
           <div className='flex items-start justify-between'>
            <div className='flex-1'>
             <div className='flex items-center gap-3 mb-3'>
              <h3 className='text-lg font-semibold text-neutral-900'>
               {apiKey.name}
              </h3>
              <span
               className={`px-2 py-1 text-xs rounded-full font-medium ${
                apiKey.isActive ? 'badge-success' : 'badge-error'
               }`}
              >
               {apiKey.isActive ? 'Active' : 'Inactive'}
              </span>
             </div>

             <div className='space-y-3'>
              <div>
               <Label className='text-sm font-medium text-neutral-500'>
                API Key
               </Label>
               <div className='flex items-center gap-2 mt-1'>
                <code className='flex-1 px-3 py-2 bg-neutral-100 rounded-lg text-sm font-mono'>
                 {showKeys.has(apiKey.id)
                  ? apiKey.key
                  : '••••••••••••••••••••••••••••••••'}
                </code>
                <Button
                 variant='outline'
                 size='sm'
                 onClick={() => toggleKeyVisibility(apiKey.id)}
                 className='btn-secondary flex items-center gap-1'
                >
                 {showKeys.has(apiKey.id) ? (
                  <EyeOff className='h-4 w-4' />
                 ) : (
                  <Eye className='h-4 w-4' />
                 )}
                </Button>
                <Button
                 variant='outline'
                 size='sm'
                 onClick={() => copyToClipboard(apiKey.key)}
                 className='btn-secondary flex items-center gap-1'
                >
                 <Copy className='h-4 w-4' />
                </Button>
               </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
               <div>
                <Label className='text-sm font-medium text-neutral-500'>
                 Created
                </Label>
                <p className='text-sm text-neutral-900'>
                 {new Date(apiKey.createdAt).toLocaleDateString()}
                </p>
               </div>
               <div>
                <Label className='text-sm font-medium text-neutral-500'>
                 Last Used
                </Label>
                <p className='text-sm text-neutral-900'>
                 {apiKey.lastUsedAt
                  ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                  : 'Never'}
                </p>
               </div>
              </div>

              {apiKey.permissions.length > 0 && (
               <div>
                <Label className='text-sm font-medium text-neutral-500'>
                 Permissions
                </Label>
                <div className='flex flex-wrap gap-2 mt-1'>
                 {apiKey.permissions.map((permission) => (
                  <span
                   key={permission}
                   className='px-2 py-1 bg-accent-blue-100 text-accent-blue-800 text-xs rounded-full'
                  >
                   {permission}
                  </span>
                 ))}
                </div>
               </div>
              )}
             </div>
            </div>

            <Button
             variant='outline'
             size='sm'
             onClick={() => handleDeleteApiKey(apiKey.id)}
             className='btn-danger flex items-center gap-1'
            >
             <Trash2 className='h-4 w-4' />
            </Button>
           </div>
          </div>
         ))}
        </div>
       )}
      </CardContent>
     </Card>
    </div>

    {/* Sidebar */}
    <div className='space-y-6'>
     {/* Usage Stats */}
     <Card className='card-gradient-blue'>
      <CardHeader className='pb-4'>
       <CardTitle className='flex items-center gap-2 text-lg'>
        <Activity className='h-5 w-5 text-accent-blue-600' />
        Usage Stats
       </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
       <div className='flex items-center justify-between'>
        <span className='text-sm text-neutral-600'>Total Keys</span>
        <span className='text-lg font-semibold text-neutral-900'>
         {apiKeys.length}
        </span>
       </div>
       <div className='flex items-center justify-between'>
        <span className='text-sm text-neutral-600'>Active Keys</span>
        <span className='text-lg font-semibold text-accent-green-600'>
         {apiKeys.filter((key) => key.isActive).length}
        </span>
       </div>
       <div className='flex items-center justify-between'>
        <span className='text-sm text-neutral-600'>Recently Used</span>
        <span className='text-lg font-semibold text-accent-blue-600'>
         {
          apiKeys.filter(
           (key) =>
            key.lastUsedAt &&
            new Date(key.lastUsedAt) >
             new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length
         }
        </span>
       </div>
      </CardContent>
     </Card>

     {/* Quick Guide */}
     <Card className='card-primary'>
      <CardHeader className='pb-4'>
       <CardTitle className='text-lg'>Quick Guide</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
       <div className='space-y-3'>
        <div className='flex items-start gap-3'>
         <div className='w-6 h-6 bg-accent-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
          <span className='text-xs font-bold text-accent-blue-600'>1</span>
         </div>
         <div>
          <p className='text-sm font-medium text-neutral-900'>Create API Key</p>
          <p className='text-xs text-neutral-600'>
           Generate a new key with specific permissions
          </p>
         </div>
        </div>
        <div className='flex items-start gap-3'>
         <div className='w-6 h-6 bg-accent-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
          <span className='text-xs font-bold text-accent-blue-600'>2</span>
         </div>
         <div>
          <p className='text-sm font-medium text-neutral-900'>Copy Key</p>
          <p className='text-xs text-neutral-600'>
           Copy the key to use in your applications
          </p>
         </div>
        </div>
        <div className='flex items-start gap-3'>
         <div className='w-6 h-6 bg-accent-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
          <span className='text-xs font-bold text-accent-blue-600'>3</span>
         </div>
         <div>
          <p className='text-sm font-medium text-neutral-900'>Use in Code</p>
          <p className='text-xs text-neutral-600'>
           Include in Authorization header
          </p>
         </div>
        </div>
       </div>
      </CardContent>
     </Card>

     {/* Security Tips */}
     <Card className='card-gradient-orange'>
      <CardHeader className='pb-4'>
       <CardTitle className='flex items-center gap-2 text-lg'>
        <AlertTriangle className='h-5 w-5 text-accent-orange-600' />
        Security Tips
       </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
       <div className='flex items-start gap-2 text-sm'>
        <Lock className='h-4 w-4 text-accent-orange-600 mt-0.5 flex-shrink-0' />
        <p className='text-neutral-700'>
         Keep your API keys secure and never share them publicly
        </p>
       </div>
       <div className='flex items-start gap-2 text-sm'>
        <Shield className='h-4 w-4 text-accent-orange-600 mt-0.5 flex-shrink-0' />
        <p className='text-neutral-700'>
         Use environment variables to store keys in production
        </p>
       </div>
       <div className='flex items-start gap-2 text-sm'>
        <Trash2 className='h-4 w-4 text-accent-orange-600 mt-0.5 flex-shrink-0' />
        <p className='text-neutral-700'>
         Delete unused keys to minimize security risks
        </p>
       </div>
      </CardContent>
     </Card>
    </div>
   </div>

   {/* New Key Modal */}
   {showNewKey && (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
     <div className='bg-white rounded-xl p-6 max-w-md w-full'>
      <div className='text-center space-y-4'>
       <div className='w-16 h-16 mx-auto bg-accent-green-100 rounded-full flex items-center justify-center'>
        <CheckCircle className='h-8 w-8 text-accent-green-600' />
       </div>
       <h3 className='text-xl font-semibold text-neutral-900'>
        API Key Created!
       </h3>
       <p className='text-neutral-600'>
        Copy your new API key. You won't be able to see it again.
       </p>

       <div className='space-y-3'>
        <div className='p-3 bg-neutral-100 rounded-lg'>
         <code className='text-sm font-mono break-all'>{showNewKey}</code>
        </div>
        <Button
         onClick={() => copyToClipboard(showNewKey)}
         className='btn-success w-full'
        >
         <Copy className='h-4 w-4 mr-2' />
         Copy to Clipboard
        </Button>
       </div>

       <Button
        variant='outline'
        onClick={() => setShowNewKey(null)}
        className='btn-secondary w-full'
       >
        Close
       </Button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}
