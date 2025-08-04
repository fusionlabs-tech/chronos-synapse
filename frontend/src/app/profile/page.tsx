'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { User } from '@/types';
import { useToast } from '@/components/ui/Toast';
import {
 User as UserIcon,
 Mail,
 Lock,
 Key,
 Shield,
 Save,
 Edit,
 X,
 Calendar,
 Crown,
 CheckCircle,
} from 'lucide-react';

export default function ProfilePage() {
 const { user, updateUser } = useAuth();
 const { showToast } = useToast();
 const [loading, setLoading] = useState(false);
 const [editing, setEditing] = useState(false);
 const [passwordEditing, setPasswordEditing] = useState(false);

 // Profile form state
 const [profileData, setProfileData] = useState({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
 });

 // Password form state
 const [passwordData, setPasswordData] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
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
   // Convert date strings to Date objects for AuthContext
   const userForContext = {
    ...updatedUser,
    createdAt: new Date(updatedUser.createdAt),
    updatedAt: new Date(updatedUser.updatedAt),
    lastLoginAt: updatedUser.lastLoginAt
     ? new Date(updatedUser.lastLoginAt)
     : null,
   };
   updateUser(userForContext);
   setEditing(false);
   showToast('Profile updated successfully', 'success');
  } catch (error) {
   console.error('Failed to update profile:', error);
   showToast('Failed to update profile', 'error');
  } finally {
   setLoading(false);
  }
 };

 const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();

  if (passwordData.newPassword !== passwordData.confirmPassword) {
   showToast('New passwords do not match', 'error');
   return;
  }

  if (passwordData.newPassword.length < 8) {
   showToast('Password must be at least 8 characters long', 'error');
   return;
  }

  setLoading(true);

  try {
   await apiClient.changePassword(
    passwordData.currentPassword,
    passwordData.newPassword
   );
   setPasswordData({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
   });
   setPasswordEditing(false);
   showToast('Password changed successfully', 'success');
  } catch (error) {
   console.error('Failed to change password:', error);
   showToast('Failed to change password', 'error');
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
   <div className='text-center space-y-4'>
    <div className='page-header-icon'>
     <UserIcon className='h-10 w-10 text-white' />
    </div>
    <div>
     <h1 className='page-header-title'>Profile Settings</h1>
     <p className='text-neutral-600 mt-2 text-lg'>
      Manage your account information and security settings
     </p>
    </div>
   </div>

   <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
    {/* Profile Information */}
    <div className='lg:col-span-2 space-y-6'>
     <Card className='card-primary'>
      <CardHeader className='pb-6'>
       <CardTitle className='flex items-center gap-3 text-xl'>
        <div className='icon-container-blue'>
         <UserIcon className='h-5 w-5' />
        </div>
        Profile Information
       </CardTitle>
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
          <Button
           type='submit'
           disabled={loading}
           className='btn-primary flex items-center gap-2'
          >
           <Save className='h-4 w-4' />
           {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
           type='button'
           variant='outline'
           onClick={() => setEditing(false)}
           disabled={loading}
           className='btn-secondary flex items-center gap-2'
          >
           <X className='h-4 w-4' />
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

         <Button
          onClick={() => setEditing(true)}
          className='btn-primary flex items-center gap-2'
         >
          <Edit className='h-4 w-4' />
          Edit Profile
         </Button>
        </div>
       )}
      </CardContent>
     </Card>

     {/* Security Settings */}
     <Card className='card-primary'>
      <CardHeader className='pb-6'>
       <CardTitle className='flex items-center gap-3 text-xl'>
        <div className='icon-container-green'>
         <Shield className='h-5 w-5' />
        </div>
        Security Settings
       </CardTitle>
      </CardHeader>
      <CardContent>
       {passwordEditing ? (
        <form onSubmit={handlePasswordChange} className='space-y-6'>
         <div className='space-y-2'>
          <Label
           htmlFor='currentPassword'
           className='text-sm font-medium text-neutral-700'
          >
           Current Password
          </Label>
          <Input
           id='currentPassword'
           type='password'
           value={passwordData.currentPassword}
           onChange={(e) =>
            setPasswordData((prev) => ({
             ...prev,
             currentPassword: e.target.value,
            }))
           }
           className='input-primary'
           required
          />
         </div>

         <div className='space-y-2'>
          <Label
           htmlFor='newPassword'
           className='text-sm font-medium text-neutral-700'
          >
           New Password
          </Label>
          <Input
           id='newPassword'
           type='password'
           value={passwordData.newPassword}
           onChange={(e) =>
            setPasswordData((prev) => ({
             ...prev,
             newPassword: e.target.value,
            }))
           }
           className='input-primary'
           required
          />
         </div>

         <div className='space-y-2'>
          <Label
           htmlFor='confirmPassword'
           className='text-sm font-medium text-neutral-700'
          >
           Confirm New Password
          </Label>
          <Input
           id='confirmPassword'
           type='password'
           value={passwordData.confirmPassword}
           onChange={(e) =>
            setPasswordData((prev) => ({
             ...prev,
             confirmPassword: e.target.value,
            }))
           }
           className='input-primary'
           required
          />
         </div>

         <div className='flex gap-3 pt-4'>
          <Button
           type='submit'
           disabled={loading}
           className='btn-success flex items-center gap-2'
          >
           <Lock className='h-4 w-4' />
           {loading ? 'Changing...' : 'Change Password'}
          </Button>
          <Button
           type='button'
           variant='outline'
           onClick={() => setPasswordEditing(false)}
           disabled={loading}
           className='btn-secondary flex items-center gap-2'
          >
           <X className='h-4 w-4' />
           Cancel
          </Button>
         </div>
        </form>
       ) : (
        <div className='space-y-6'>
         <div className='space-y-2'>
          <Label className='text-sm font-medium text-neutral-500'>
           Password
          </Label>
          <p className='text-lg font-medium text-neutral-900'>••••••••</p>
         </div>

         <Button
          onClick={() => setPasswordEditing(true)}
          variant='outline'
          className='btn-secondary flex items-center gap-2'
         >
          <Lock className='h-4 w-4' />
          Change Password
         </Button>
        </div>
       )}
      </CardContent>
     </Card>
    </div>

    {/* Sidebar */}
    <div className='space-y-6'>
     {/* Account Status */}
     <Card className='card-gradient-blue'>
      <CardHeader className='pb-4'>
       <CardTitle className='flex items-center gap-2 text-lg'>
        <CheckCircle className='h-5 w-5 text-accent-green-600' />
        Account Status
       </CardTitle>
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
        className='btn-secondary w-full justify-start gap-3'
        onClick={() => (window.location.href = '/api-keys')}
       >
        <Key className='h-4 w-4' />
        Manage API Keys
       </Button>
       {user.role === 'ADMIN' && (
        <Button
         variant='outline'
         className='btn-secondary w-full justify-start gap-3'
         onClick={() => (window.location.href = '/dashboard/admin')}
        >
         <Crown className='h-4 w-4' />
         Admin Dashboard
        </Button>
       )}
      </CardContent>
     </Card>

     {/* Account Info */}
     <Card className='card-primary'>
      <CardHeader className='pb-4'>
       <CardTitle className='text-lg'>Account Info</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
       <div className='flex items-center gap-3 text-sm'>
        <Calendar className='h-4 w-4 text-neutral-400' />
        <div>
         <p className='font-medium text-neutral-900'>Last Login</p>
         <p className='text-neutral-600'>
          {user.lastLoginAt
           ? new Date(user.lastLoginAt).toLocaleString()
           : 'Never'}
         </p>
        </div>
       </div>
       <div className='flex items-center gap-3 text-sm'>
        <Mail className='h-4 w-4 text-neutral-400' />
        <div>
         <p className='font-medium text-neutral-900'>Email Verified</p>
         <p className='text-accent-green-600'>✓ Verified</p>
        </div>
       </div>
      </CardContent>
     </Card>
    </div>
   </div>
  </div>
 );
}
