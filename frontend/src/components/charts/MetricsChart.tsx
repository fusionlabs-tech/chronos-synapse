'use client';

import { useState, useEffect } from 'react';
import {
 LineChart,
 Line,
 BarChart,
 Bar,
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 Legend,
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell,
} from 'recharts';
import { apiClient } from '@/lib/api';
import { MetricsData, ChartDataPoint } from '@/types';

interface MetricsChartProps {
 type: 'line' | 'bar' | 'area' | 'pie';
 title: string;
 dataKey: string;
 color?: string;
 height?: number;
 timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
}

const COLORS = [
 '#3B82F6',
 '#10B981',
 '#F59E0B',
 '#EF4444',
 '#8B5CF6',
 '#06B6D4',
];

export function MetricsChart({
 type,
 title,
 dataKey,
 color = '#3B82F6',
 height = 300,
 timeRange = '24h',
}: MetricsChartProps) {
 const [data, setData] = useState<ChartDataPoint[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const fetchMetrics = async () => {
   try {
    setLoading(true);
    const now = Date.now();
    const timeRanges = {
     '1h': 60 * 60 * 1000,
     '6h': 6 * 60 * 60 * 1000,
     '24h': 24 * 60 * 60 * 1000,
     '7d': 7 * 24 * 60 * 60 * 1000,
     '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const fromTimestamp = now - timeRanges[timeRange];
    const metrics = await apiClient.getMetrics(dataKey, fromTimestamp, now);

    // Transform data for the specific metric
    const transformedData = metrics.map((metric) => ({
     timestamp: metric.timestamp,
     value: metric.value,
     label: new Date(metric.timestamp).toLocaleTimeString(),
    }));

    setData(transformedData);
   } catch (err) {
    console.error('Failed to fetch metrics:', err);
    setError('Failed to load metrics data');
   } finally {
    setLoading(false);
   }
  };

  fetchMetrics();
 }, [dataKey, timeRange]);

 if (loading) {
  return (
   <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
    <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>
    <div className='flex items-center justify-center h-64'>
     <div className='animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600'></div>
    </div>
   </div>
  );
 }

 if (error) {
  return (
   <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
    <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>
    <div className='flex items-center justify-center h-64 text-red-600'>
     {error}
    </div>
   </div>
  );
 }

 const renderChart = () => {
  const commonProps = {
   data,
   height,
   margin: { top: 5, right: 30, left: 20, bottom: 5 },
  };

  switch (type) {
   case 'line':
    return (
     <LineChart {...commonProps}>
      <CartesianGrid strokeDasharray='3 3' />
      <XAxis
       dataKey='label'
       tick={{ fontSize: 12 }}
       interval='preserveStartEnd'
      />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip
       formatter={(value: number) => [value, dataKey]}
       labelFormatter={(label) => `Time: ${label}`}
      />
      <Legend />
      <Line
       type='monotone'
       dataKey='value'
       stroke={color}
       strokeWidth={2}
       dot={{ fill: color, strokeWidth: 2, r: 4 }}
       activeDot={{ r: 6 }}
      />
     </LineChart>
    );

   case 'bar':
    return (
     <BarChart {...commonProps}>
      <CartesianGrid strokeDasharray='3 3' />
      <XAxis
       dataKey='label'
       tick={{ fontSize: 12 }}
       interval='preserveStartEnd'
      />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip
       formatter={(value: number) => [value, dataKey]}
       labelFormatter={(label) => `Time: ${label}`}
      />
      <Legend />
      <Bar dataKey='value' fill={color} radius={[4, 4, 0, 0]} />
     </BarChart>
    );

   case 'area':
    return (
     <AreaChart {...commonProps}>
      <CartesianGrid strokeDasharray='3 3' />
      <XAxis
       dataKey='label'
       tick={{ fontSize: 12 }}
       interval='preserveStartEnd'
      />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip
       formatter={(value: number) => [value, dataKey]}
       labelFormatter={(label) => `Time: ${label}`}
      />
      <Legend />
      <Area
       type='monotone'
       dataKey='value'
       stroke={color}
       fill={color}
       fillOpacity={0.3}
      />
     </AreaChart>
    );

   case 'pie':
    // For pie charts, we'll show a summary of the data
    const pieData = [
     { name: 'Success', value: data.filter((d) => d.value > 0).length },
     { name: 'Failed', value: data.filter((d) => d.value === 0).length },
    ];

    return (
     <PieChart {...commonProps}>
      <Pie
       data={pieData}
       cx='50%'
       cy='50%'
       labelLine={false}
       label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
       outerRadius={80}
       fill='#8884d8'
       dataKey='value'
      >
       {pieData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
       ))}
      </Pie>
      <Tooltip />
      <Legend />
     </PieChart>
    );

   default:
    return (
     <LineChart {...commonProps}>
      <CartesianGrid strokeDasharray='3 3' />
      <XAxis
       dataKey='label'
       tick={{ fontSize: 12 }}
       interval='preserveStartEnd'
      />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip
       formatter={(value: number) => [value, dataKey]}
       labelFormatter={(label) => `Time: ${label}`}
      />
      <Legend />
      <Line
       type='monotone'
       dataKey='value'
       stroke={color}
       strokeWidth={2}
       dot={{ fill: color, strokeWidth: 2, r: 4 }}
       activeDot={{ r: 6 }}
      />
     </LineChart>
    );
  }
 };

 return (
  <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
   <div className='flex items-center justify-between mb-4'>
    <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
    <div className='flex items-center space-x-2'>
     <select
      value={timeRange}
      onChange={(e) => setData([])} // This will trigger a re-fetch
      className='text-sm border border-gray-300 rounded px-2 py-1'
     >
      <option value='1h'>1 Hour</option>
      <option value='6h'>6 Hours</option>
      <option value='24h'>24 Hours</option>
      <option value='7d'>7 Days</option>
      <option value='30d'>30 Days</option>
     </select>
    </div>
   </div>

   <ResponsiveContainer width='100%' height={height}>
    {renderChart()}
   </ResponsiveContainer>
  </div>
 );
}

// Specialized chart components for common metrics
export function JobExecutionsChart() {
 return (
  <MetricsChart
   type='line'
   title='Job Executions'
   dataKey='executions'
   color='#3B82F6'
  />
 );
}

export function JobSuccessRateChart() {
 return (
  <MetricsChart
   type='area'
   title='Success Rate'
   dataKey='success_rate'
   color='#10B981'
  />
 );
}

export function JobDurationChart() {
 return (
  <MetricsChart
   type='bar'
   title='Average Duration'
   dataKey='avg_duration'
   color='#F59E0B'
  />
 );
}

export function JobStatusPieChart() {
 return (
  <MetricsChart
   type='pie'
   title='Job Status Distribution'
   dataKey='status'
   color='#8B5CF6'
  />
 );
}
