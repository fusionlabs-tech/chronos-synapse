import React from 'react';

interface BadgeProps {
 children: React.ReactNode;
 variant?:
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'gray';
 className?: string;
}

export function Badge({
 children,
 variant = 'default',
 className = '',
}: BadgeProps) {
 const baseClasses =
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

 const variantClasses = {
  default: 'bg-gray-100 text-gray-800',
  secondary: 'bg-blue-100 text-blue-800',
  destructive: 'bg-red-100 text-red-800',
  outline: 'border border-gray-300 text-gray-700',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
 };

 return (
  <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
   {children}
  </span>
 );
}
