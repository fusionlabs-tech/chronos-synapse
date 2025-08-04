'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
 Shield,
 AlertTriangle,
 CheckCircle,
 Clock,
 Trash2,
 RefreshCw,
 Search,
 BarChart3,
 Users,
 Activity,
 Zap,
 Eye,
 EyeOff,
} from 'lucide-react';

interface RateLimitStats {
 totalKeys: number;
 activeKeys: number;
 blockedKeys: number;
 totalRequests: number;
}

interface RateLimitKey {
 key: string;
 info: {
  key: string;
  current: number;
  limit: number;
  remaining: number;
  resetTime: number;
  ttl: number;
 } | null;
}

export default function RateLimitManager() {
 const [stats, setStats] = useState<RateLimitStats | null>(null);
 const [keys, setKeys] = useState<RateLimitKey[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchPattern, setSearchPattern] = useState('');
 const [showBlockedOnly, setShowBlockedOnly] = useState(false);
 const { showToast } = useToast();

 useEffect(() => {
  fetchRateLimitData();
 }, []);

 const fetchRateLimitData = async () => {
  try {
   setLoading(true);
   const [statsResponse, keysResponse] = await Promise.all([
    apiClient.getRateLimitStats(),
    apiClient.getRateLimitKeys(),
   ]);
   setStats(statsResponse.stats);
   setKeys(keysResponse.keys);
  } catch (error) {
   console.error('Failed to fetch rate limit data:', error);
   showToast('Failed to load rate limit data', 'error');
  } finally {
   setLoading(false);
  }
 };

 const handleSearch = async () => {
  try {
   setLoading(true);
   const response = await apiClient.getRateLimitKeys(
    searchPattern || undefined
   );
   setKeys(response.keys);
  } catch (error) {
   console.error('Failed to search rate limit keys:', error);
   showToast('Failed to search rate limit keys', 'error');
  } finally {
   setLoading(false);
  }
 };

 const handleClearRateLimit = async (key: string) => {
  if (!confirm(`Are you sure you want to clear the rate limit for "${key}"?`)) {
   return;
  }

  try {
   await apiClient.clearRateLimit(key);
   showToast('Rate limit cleared successfully', 'success');
   fetchRateLimitData(); // Refresh data
  } catch (error) {
   console.error('Failed to clear rate limit:', error);
   showToast('Failed to clear rate limit', 'error');
  }
 };

 const handleClearAllRateLimits = async () => {
  if (
   !confirm(
    'Are you sure you want to clear ALL rate limits? This action cannot be undone.'
   )
  ) {
   return;
  }

  try {
   const response = await apiClient.clearAllRateLimits();
   showToast(`Cleared ${response.clearedCount} rate limit keys`, 'success');
   fetchRateLimitData(); // Refresh data
  } catch (error) {
   console.error('Failed to clear all rate limits:', error);
   showToast('Failed to clear all rate limits', 'error');
  }
 };

 const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
 };

 const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
 };

 const getKeyType = (key: string): string => {
  if (key.includes('password-reset')) return 'Password Reset';
  if (key.includes('login')) return 'Login';
  if (key.includes('registration')) return 'Registration';
  return 'General';
 };

 const getKeyTypeColor = (key: string): string => {
  if (key.includes('password-reset')) return 'text-orange-600 bg-orange-100';
  if (key.includes('login')) return 'text-blue-600 bg-blue-100';
  if (key.includes('registration')) return 'text-purple-600 bg-purple-100';
  return 'text-gray-600 bg-gray-100';
 };

 const filteredKeys = keys.filter((key) => {
  if (showBlockedOnly && key.info && key.info.remaining > 0) {
   return false;
  }
  return true;
 });

 if (loading) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600'></div>
   </div>
  );
 }

 return (
  <div className='space-y-6'>
   {/* Header */}
   <div className='flex items-center justify-between'>
    <div>
     <h2 className='text-2xl font-bold gradient-text-primary'>
      Rate Limit Management
     </h2>
     <p className='text-neutral-600 mt-1'>
      Monitor and manage API rate limiting
     </p>
    </div>
    <div className='flex items-center gap-3'>
     <Button
      onClick={fetchRateLimitData}
      variant='outline'
      className='btn-secondary'
     >
      <RefreshCw className='h-4 w-4 mr-2' />
      Refresh
     </Button>
     <Button
      onClick={handleClearAllRateLimits}
      variant='outline'
      className='btn-danger'
     >
      <Trash2 className='h-4 w-4 mr-2' />
      Clear All
     </Button>
    </div>
   </div>

   {/* Statistics Cards */}
   {stats && (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
     <Card className='card-primary'>
      <CardContent className='p-6'>
       <div className='flex items-center justify-between'>
        <div>
         <p className='text-sm font-medium text-neutral-600'>Total Keys</p>
         <p className='text-2xl font-bold text-neutral-900'>
          {stats.totalKeys}
         </p>
        </div>
        <div className='icon-container-primary'>
         <Shield className='h-5 w-5' />
        </div>
       </div>
      </CardContent>
     </Card>

     <Card className='card-primary'>
      <CardContent className='p-6'>
       <div className='flex items-center justify-between'>
        <div>
         <p className='text-sm font-medium text-neutral-600'>Active Keys</p>
         <p className='text-2xl font-bold text-accent-green-600'>
          {stats.activeKeys}
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
         <p className='text-sm font-medium text-neutral-600'>Blocked Keys</p>
         <p className='text-2xl font-bold text-accent-red-600'>
          {stats.blockedKeys}
         </p>
        </div>
        <div className='icon-container-red'>
         <AlertTriangle className='h-5 w-5' />
        </div>
       </div>
      </CardContent>
     </Card>

     <Card className='card-primary'>
      <CardContent className='p-6'>
       <div className='flex items-center justify-between'>
        <div>
         <p className='text-sm font-medium text-neutral-600'>Total Requests</p>
         <p className='text-2xl font-bold text-primary-600'>
          {stats.totalRequests}
         </p>
        </div>
        <div className='icon-container-blue'>
         <Activity className='h-5 w-5' />
        </div>
       </div>
      </CardContent>
     </Card>
    </div>
   )}

   {/* Search and Filters */}
   <Card className='card-primary'>
    <CardContent className='p-6'>
     <div className='flex items-center gap-4'>
      <div className='flex-1'>
       <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
        <Input
         type='text'
         placeholder='Search rate limit keys (e.g., password-reset, login)'
         value={searchPattern}
         onChange={(e) => setSearchPattern(e.target.value)}
         className='input-primary pl-10'
         onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
       </div>
      </div>
      <Button onClick={handleSearch} className='btn-primary'>
       Search
      </Button>
      <Button
       onClick={() => setShowBlockedOnly(!showBlockedOnly)}
       variant={showBlockedOnly ? 'default' : 'outline'}
       className={showBlockedOnly ? 'btn-danger' : 'btn-secondary'}
      >
       {showBlockedOnly ? (
        <EyeOff className='h-4 w-4 mr-2' />
       ) : (
        <Eye className='h-4 w-4 mr-2' />
       )}
       {showBlockedOnly ? 'Show All' : 'Blocked Only'}
      </Button>
     </div>
    </CardContent>
   </Card>

   {/* Rate Limit Keys Table */}
   <Card className='card-primary'>
    <CardHeader>
     <CardTitle className='flex items-center gap-2'>
      <BarChart3 className='h-5 w-5' />
      Rate Limit Keys ({filteredKeys.length})
     </CardTitle>
    </CardHeader>
    <CardContent>
     {filteredKeys.length === 0 ? (
      <div className='text-center py-8 text-neutral-500'>
       <Shield className='h-12 w-12 mx-auto mb-4 text-neutral-300' />
       <p>No rate limit keys found</p>
      </div>
     ) : (
      <div className='overflow-x-auto'>
       <table className='w-full'>
        <thead>
         <tr className='border-b border-neutral-200'>
          <th className='text-left py-3 px-4 font-medium text-neutral-700'>
           Key
          </th>
          <th className='text-left py-3 px-4 font-medium text-neutral-700'>
           Type
          </th>
          <th className='text-left py-3 px-4 font-medium text-neutral-700'>
           Status
          </th>
          <th className='text-left py-3 px-4 font-medium text-neutral-700'>
           Usage
          </th>
          <th className='text-left py-3 px-4 font-medium text-neutral-700'>
           Reset Time
          </th>
          <th className='text-left py-3 px-4 font-medium text-neutral-700'>
           Actions
          </th>
         </tr>
        </thead>
        <tbody>
         {filteredKeys.map((keyData) => (
          <tr
           key={keyData.key}
           className='border-b border-neutral-100 hover:bg-neutral-50'
          >
           <td className='py-3 px-4'>
            <div className='font-mono text-sm text-neutral-900'>
             {keyData.key}
            </div>
           </td>
           <td className='py-3 px-4'>
            <span
             className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getKeyTypeColor(
              keyData.key
             )}`}
            >
             {getKeyType(keyData.key)}
            </span>
           </td>
           <td className='py-3 px-4'>
            {keyData.info ? (
             keyData.info.remaining === 0 ? (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-red-800 bg-red-100'>
               <AlertTriangle className='h-3 w-3 mr-1' />
               Blocked
              </span>
             ) : (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-800 bg-green-100'>
               <CheckCircle className='h-3 w-3 mr-1' />
               Active
              </span>
             )
            ) : (
             <span className='text-neutral-400 text-sm'>No data</span>
            )}
           </td>
           <td className='py-3 px-4'>
            {keyData.info ? (
             <div className='text-sm'>
              <div className='font-medium text-neutral-900'>
               {keyData.info.current}/{keyData.info.limit}
              </div>
              <div className='text-neutral-500'>
               {keyData.info.remaining} remaining
              </div>
             </div>
            ) : (
             <span className='text-neutral-400 text-sm'>No data</span>
            )}
           </td>
           <td className='py-3 px-4'>
            {keyData.info ? (
             <div className='text-sm'>
              <div className='font-medium text-neutral-900'>
               {formatTime(keyData.info.ttl)}
              </div>
              <div className='text-neutral-500'>
               {formatDate(keyData.info.resetTime)}
              </div>
             </div>
            ) : (
             <span className='text-neutral-400 text-sm'>No data</span>
            )}
           </td>
           <td className='py-3 px-4'>
            <Button
             onClick={() => handleClearRateLimit(keyData.key)}
             variant='outline'
             size='sm'
             className='btn-danger'
            >
             <Trash2 className='h-4 w-4' />
            </Button>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     )}
    </CardContent>
   </Card>
  </div>
 );
}
