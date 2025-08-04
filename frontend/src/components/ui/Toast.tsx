'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface Toast {
 id: string;
 message: string;
 type: 'success' | 'error' | 'warning' | 'info';
 duration?: number;
}

interface ToastProps {
 toast: Toast;
 onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
 const [isVisible, setIsVisible] = useState(false);

 useEffect(() => {
  // Animate in
  const timer = setTimeout(() => setIsVisible(true), 100);
  return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
  // Auto-remove after duration
  if (toast.duration !== 0) {
   const timer = setTimeout(() => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300); // Wait for animation
   }, toast.duration || 5000);
   return () => clearTimeout(timer);
  }
 }, [toast.id, toast.duration, onRemove]);

 const getIcon = () => {
  switch (toast.type) {
   case 'success':
    return '✅';
   case 'error':
    return '❌';
   case 'warning':
    return '⚠️';
   case 'info':
    return 'ℹ️';
   default:
    return '📢';
  }
 };

 const getStyles = () => {
  const baseStyles =
   'flex items-center p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform';

  switch (toast.type) {
   case 'success':
    return `${baseStyles} bg-green-50 border-green-400 text-green-800`;
   case 'error':
    return `${baseStyles} bg-red-50 border-red-400 text-red-800`;
   case 'warning':
    return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`;
   case 'info':
    return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`;
   default:
    return `${baseStyles} bg-gray-50 border-gray-400 text-gray-800`;
  }
 };

 return (
  <div
   className={`${getStyles()} ${
    isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
   }`}
  >
   <span className='mr-3 text-lg'>{getIcon()}</span>
   <span className='flex-1 text-sm font-medium'>{toast.message}</span>
   <button
    onClick={() => {
     setIsVisible(false);
     setTimeout(() => onRemove(toast.id), 300);
    }}
    className='ml-4 text-gray-400 hover:text-gray-600 transition-colors'
   >
    ✕
   </button>
  </div>
 );
}

interface ToastContainerProps {
 toasts: Toast[];
 onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
  setMounted(true);
 }, []);

 if (!mounted) return null;

 return createPortal(
  <div className='fixed top-4 right-4 z-50 space-y-2 max-w-sm'>
   {toasts.map((toast) => (
    <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
   ))}
  </div>,
  document.body
 );
}

// Toast context and hook
import { createContext, useContext, useCallback } from 'react';

interface ToastContextType {
 showToast: (message: string, type?: Toast['type'], duration?: number) => void;
 removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
 const context = useContext(ToastContext);
 if (!context) {
  throw new Error('useToast must be used within a ToastProvider');
 }
 return context;
}

interface ToastProviderProps {
 children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
 const [toasts, setToasts] = useState<Toast[]>([]);

 const showToast = useCallback(
  (message: string, type: Toast['type'] = 'info', duration = 5000) => {
   const id = Date.now().toString();
   const newToast: Toast = { id, message, type, duration };
   setToasts((prev) => [...prev, newToast]);
  },
  []
 );

 const removeToast = useCallback((id: string) => {
  setToasts((prev) => prev.filter((toast) => toast.id !== id));
 }, []);

 return (
  <ToastContext.Provider value={{ showToast, removeToast }}>
   {children}
   <ToastContainer toasts={toasts} onRemove={removeToast} />
  </ToastContext.Provider>
 );
}
