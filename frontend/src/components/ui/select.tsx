import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
 children: React.ReactNode;
}

export function Select({ children, className = '', ...props }: SelectProps) {
 return (
  <select
   className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
   {...props}
  >
   {children}
  </select>
 );
}
