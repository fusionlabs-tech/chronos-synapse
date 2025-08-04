'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { User } from '@/types';
import { useToast } from '@/components/ui/Toast';
import RateLimitManager from '@/components/admin/RateLimitManager';
import {
 Shield,
 Users,
 Settings,
 Activity,
 CheckCircle,
 AlertTriangle,
 Trash2,
 Eye,
 EyeOff,
 Crown,
 BarChart3,
 Calendar,
 Zap,
 ArrowUp,
 ArrowDown,
} from 'lucide-react';

export default function AdminPage() {
 const [users, setUsers] = useState<User[]>([]);
 const [systemStats, setSystemStats] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<
  'overview' | 'users' | 'rate-limits'
 >('overview');
 const { showToast } = useToast();

 useEffect(() => {
  fetchAdminData();
 }, []);

 const fetchAdminData = async () => {
  try {
   setLoading(true);
   const [usersResponse, statsResponse] = await Promise.all([
    apiClient.getAdminUsers(),
    apiClient.getAdminSystemStats(),
   ]);
   setUsers(usersResponse.users);
   setSystemStats(statsResponse);
  } catch (error) {
   console.error('Failed to fetch admin data:', error);
   showToast('Failed to load admin data', 'error');
  } finally {
   setLoading(false);
  }
 };

 const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
  try {
   await apiClient.updateUserStatus(userId, isActive);
   setUsers((prev) =>
    prev.map((user) => (user.id === userId ? { ...user, isActive } : user))
   );
   showToast(
    `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    'success'
   );
  } catch (error) {
   console.error('Failed to update user status:', error);
   showToast('Failed to update user status', 'error');
  }
 };

 const handleDeleteUser = async (userId: string) => {
  if (
   !confirm(
    'Are you sure you want to delete this user? This action cannot be undone.'
   )
  ) {
   return;
  }

  try {
   await apiClient.deleteUser(userId);
   setUsers((prev) => prev.filter((user) => user.id !== userId));
   showToast('User deleted successfully', 'success');
  } catch (error) {
   console.error('Failed to delete user:', error);
   showToast('Failed to delete user', 'error');
  }
 };

 const getTrendIcon = (value: number) => {
  if (value > 0) return <ArrowUp className='h-4 w-4 text-green-600' />;
  if (value < 0) return <ArrowDown className='h-4 w-4 text-red-600' />;
  return null;
 };

 if (loading) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600'></div>
   </div>
  );
 }

 // Tab navigation
 const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'rate-limits', label: 'Rate Limits', icon: Shield },
 ];

 const renderTabContent = () => {
  switch (activeTab) {
   case 'overview':
    return (
     <div className='space-y-6'>
      {/* System Statistics */}
      {systemStats && (
       <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card className='card-primary'>
         <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
           <div>
            <p className='text-sm font-medium text-neutral-600'>Total Users</p>
            <p className='text-2xl font-bold text-neutral-900'>
             {systemStats.totalUsers}
            </p>
           </div>
           <div className='icon-container-primary'>
            <Users className='h-5 w-5' />
           </div>
          </div>
         </CardContent>
        </Card>

        <Card className='card-primary'>
         <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
           <div>
            <p className='text-sm font-medium text-neutral-600'>Active Users</p>
            <p className='text-2xl font-bold text-accent-green-600'>
             {systemStats.activeUsers}
            </p>
           </div>
           <div className='icon-container-green'>
            <CheckCircle className='h-5 w-5' />
           </div>
          </div>
         </CardContent>
        </Card>

        <Card className='card-primary'>
         <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
           <div>
            <p className='text-sm font-medium text-neutral-600'>Total Jobs</p>
            <p className='text-2xl font-bold text-primary-600'>
             {systemStats.totalJobs}
            </p>
           </div>
           <div className='icon-container-blue'>
            <Zap className='h-5 w-5' />
           </div>
          </div>
         </CardContent>
        </Card>

        <Card className='card-primary'>
         <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
           <div>
            <p className='text-sm font-medium text-neutral-600'>Success Rate</p>
            <p className='text-2xl font-bold text-accent-green-600'>
             {systemStats.systemSuccessRate.toFixed(1)}%
            </p>
           </div>
           <div className='icon-container-green'>
            <Activity className='h-5 w-5' />
           </div>
          </div>
         </CardContent>
        </Card>
       </div>
      )}

      {/* Recent Activity */}
      {systemStats?.recentActivity && (
       <Card className='card-primary'>
        <CardHeader>
         <CardTitle className='flex items-center gap-2'>
          <Activity className='h-5 w-5' />
          Recent Activity
         </CardTitle>
        </CardHeader>
        <CardContent>
         <div className='space-y-4'>
          {systemStats.recentActivity.map((activity: any, index: number) => (
           <div
            key={index}
            className='flex items-center justify-between p-3 bg-neutral-50 rounded-lg'
           >
            <div className='flex items-center gap-3'>
             <div className='w-2 h-2 bg-primary-500 rounded-full'></div>
             <div>
              <p className='text-sm font-medium text-neutral-900'>
               {activity.description}
              </p>
              <p className='text-xs text-neutral-500'>{activity.type}</p>
             </div>
            </div>
            <span className='text-xs text-neutral-500'>
             {new Date(activity.timestamp).toLocaleString()}
            </span>
           </div>
          ))}
         </div>
        </CardContent>
       </Card>
      )}

      {/* System Status */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
       <Card className='card-primary'>
        <CardHeader>
         <CardTitle className='flex items-center gap-2'>
          <CheckCircle className='h-5 w-5' />
          System Status
         </CardTitle>
        </CardHeader>
        <CardContent>
         <div className='space-y-4'>
          <div className='flex items-center justify-between p-4 bg-accent-green-50 rounded-lg border border-accent-green-200'>
           <div className='flex items-center gap-3'>
            <CheckCircle className='h-5 w-5 text-accent-green-600' />
            <div>
             <p className='font-medium text-accent-green-900'>Database</p>
             <p className='text-sm text-accent-green-700'>
              PostgreSQL connected
             </p>
            </div>
           </div>
           <div className='w-3 h-3 bg-accent-green-500 rounded-full animate-pulse'></div>
          </div>

          <div className='flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-200'>
           <div className='flex items-center gap-3'>
            <Zap className='h-5 w-5 text-primary-600' />
            <div>
             <p className='font-medium text-primary-900'>Redis Cache</p>
             <p className='text-sm text-primary-700'>Cloud instance active</p>
            </div>
           </div>
           <div className='w-3 h-3 bg-primary-500 rounded-full animate-pulse'></div>
          </div>

          <div className='flex items-center justify-between p-4 bg-secondary-50 rounded-lg border border-secondary-200'>
           <div className='flex items-center gap-3'>
            <Activity className='h-5 w-5 text-secondary-600' />
            <div>
             <p className='font-medium text-secondary-900'>Job Scheduler</p>
             <p className='text-sm text-secondary-700'>Running smoothly</p>
            </div>
           </div>
           <div className='w-3 h-3 bg-secondary-500 rounded-full animate-pulse'></div>
          </div>
         </div>
        </CardContent>
       </Card>

       <Card className='card-primary'>
        <CardHeader>
         <CardTitle className='flex items-center gap-2'>
          <Calendar className='h-5 w-5' />
          Quick Actions
         </CardTitle>
        </CardHeader>
        <CardContent>
         <div className='space-y-4'>
          <Button className='w-full btn-primary'>
           <BarChart3 className='h-4 w-4 mr-2' />
           View System Logs
          </Button>

          <Button variant='outline' className='w-full btn-secondary'>
           <Activity className='h-4 w-4 mr-2' />
           Monitor Performance
          </Button>

          <Button variant='outline' className='w-full btn-secondary'>
           <Shield className='h-4 w-4 mr-2' />
           Security Audit
          </Button>

          <Button variant='outline' className='w-full btn-secondary'>
           <Settings className='h-4 w-4 mr-2' />
           System Settings
          </Button>
         </div>
        </CardContent>
       </Card>
      </div>
     </div>
    );

   case 'users':
    return (
     <div className='space-y-6'>
      {/* Users Table */}
      <Card className='card-primary'>
       <CardHeader>
        <CardTitle className='flex items-center gap-2'>
         <Users className='h-5 w-5' />
         Users ({users.length})
        </CardTitle>
       </CardHeader>
       <CardContent>
        <div className='overflow-x-auto'>
         <table className='w-full'>
          <thead>
           <tr className='border-b border-neutral-200'>
            <th className='text-left py-3 px-4 font-medium text-neutral-700'>
             User
            </th>
            <th className='text-left py-3 px-4 font-medium text-neutral-700'>
             Role
            </th>
            <th className='text-left py-3 px-4 font-medium text-neutral-700'>
             Status
            </th>
            <th className='text-left py-3 px-4 font-medium text-neutral-700'>
             Last Login
            </th>
            <th className='text-left py-3 px-4 font-medium text-neutral-700'>
             Actions
            </th>
           </tr>
          </thead>
          <tbody>
           {users.map((user) => (
            <tr
             key={user.id}
             className='border-b border-neutral-100 hover:bg-neutral-50'
            >
             <td className='py-3 px-4'>
              <div>
               <div className='font-medium text-neutral-900'>
                {user.firstName} {user.lastName}
               </div>
               <div className='text-sm text-neutral-500'>{user.email}</div>
               <div className='text-xs text-neutral-400'>@{user.username}</div>
              </div>
             </td>
             <td className='py-3 px-4'>
              <span
               className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user.role === 'ADMIN'
                 ? 'text-purple-800 bg-purple-100'
                 : 'text-blue-800 bg-blue-100'
               }`}
              >
               {user.role === 'ADMIN' && <Crown className='h-3 w-3 mr-1' />}
               {user.role}
              </span>
             </td>
             <td className='py-3 px-4'>
              <span
               className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user.isActive
                 ? 'text-green-800 bg-green-100'
                 : 'text-red-800 bg-red-100'
               }`}
              >
               {user.isActive ? (
                <CheckCircle className='h-3 w-3 mr-1' />
               ) : (
                <AlertTriangle className='h-3 w-3 mr-1' />
               )}
               {user.isActive ? 'Active' : 'Inactive'}
              </span>
             </td>
             <td className='py-3 px-4 text-sm text-neutral-500'>
              {user.lastLoginAt
               ? new Date(user.lastLoginAt).toLocaleString()
               : 'Never'}
             </td>
             <td className='py-3 px-4'>
              <div className='flex items-center gap-2'>
               <Button
                onClick={() => handleToggleUserStatus(user.id, !user.isActive)}
                variant='outline'
                size='sm'
                className={user.isActive ? 'btn-danger' : 'btn-success'}
               >
                {user.isActive ? (
                 <EyeOff className='h-4 w-4' />
                ) : (
                 <Eye className='h-4 w-4' />
                )}
               </Button>
               <Button
                onClick={() => handleDeleteUser(user.id)}
                variant='outline'
                size='sm'
                className='btn-danger'
               >
                <Trash2 className='h-4 w-4' />
               </Button>
              </div>
             </td>
            </tr>
           ))}
          </tbody>
         </table>
        </div>
       </CardContent>
      </Card>
     </div>
    );

   case 'rate-limits':
    return <RateLimitManager />;

   default:
    return null;
  }
 };

 return (
  <div className='space-y-6'>
   {/* Page Header */}
   <div className='flex items-center justify-between'>
    <div>
     <h2 className='text-2xl font-bold gradient-text-primary'>
      Admin Dashboard
     </h2>
     <p className='text-neutral-600 mt-1'>
      System administration and monitoring
     </p>
    </div>
   </div>

   {/* Tab Navigation */}
   <div className='border-b border-neutral-200'>
    <nav className='flex space-x-8'>
     {tabs.map((tab) => {
      const Icon = tab.icon;
      return (
       <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id as any)}
        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
         activeTab === tab.id
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
        }`}
       >
        <Icon className='h-4 w-4' />
        {tab.label}
       </button>
      );
     })}
    </nav>
   </div>

   {/* Tab Content */}
   <div className='mt-6'>{renderTabContent()}</div>
  </div>
 );
}
