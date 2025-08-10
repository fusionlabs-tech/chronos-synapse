'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { User } from '@/types';
import { useToast } from '@/components/ui/toast';
import { Calendar, Crown } from 'lucide-react';

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
