'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';

interface ThemeContextType {
 getGradientClass: (
  type: 'primary' | 'blue' | 'green' | 'orange' | 'red' | 'yellow'
 ) => string;
 getIconContainerClass: (
  type: 'primary' | 'blue' | 'green' | 'orange' | 'yellow' | 'red'
 ) => string;
 getButtonClass: (
  type: 'primary' | 'secondary' | 'success' | 'danger'
 ) => string;
 getCardClass: (
  type:
   | 'primary'
   | 'gradient-primary'
   | 'gradient-blue'
   | 'gradient-green'
   | 'gradient-orange'
   | 'gradient-yellow'
 ) => string;
 getBadgeClass: (type: 'success' | 'error' | 'warning' | 'info') => string;
 getTextGradientClass: (type: 'primary' | 'blue' | 'green') => string;
 isDark: boolean;
 toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
 const getGradientClass = (
  type: 'primary' | 'blue' | 'green' | 'orange' | 'red' | 'yellow'
 ) => {
  const gradients = {
   primary: 'bg-gradient-to-r from-primary-500 to-secondary-500',
   blue: 'bg-gradient-to-r from-accent-blue-500 to-accent-blue-600',
   green: 'bg-gradient-to-r from-accent-green-500 to-accent-green-600',
   orange: 'bg-gradient-to-r from-accent-orange-500 to-accent-orange-600',
   red: 'bg-gradient-to-r from-accent-red-500 to-accent-red-600',
   yellow: 'bg-gradient-to-r from-accent-yellow-500 to-accent-yellow-600',
  };
  return gradients[type];
 };

 const getIconContainerClass = (
  type: 'primary' | 'blue' | 'green' | 'orange' | 'yellow' | 'red'
 ) => {
  const containers = {
   primary: 'icon-container-primary',
   blue: 'icon-container-blue',
   green: 'icon-container-green',
   orange: 'icon-container-orange',
   yellow: 'icon-container-yellow',
   red: 'icon-container-red',
  };
  return containers[type];
 };

 const getButtonClass = (
  type: 'primary' | 'secondary' | 'success' | 'danger'
 ) => {
  const buttons = {
   primary: 'btn-primary',
   secondary: 'btn-secondary',
   success: 'btn-success',
   danger: 'btn-danger',
  };
  return buttons[type];
 };

 const getCardClass = (
  type:
   | 'primary'
   | 'gradient-primary'
   | 'gradient-blue'
   | 'gradient-green'
   | 'gradient-orange'
   | 'gradient-yellow'
 ) => {
  const cards = {
   primary: 'card-primary',
   'gradient-primary': 'card-gradient-primary',
   'gradient-blue': 'card-gradient-blue',
   'gradient-green': 'card-gradient-green',
   'gradient-orange': 'card-gradient-orange',
   'gradient-yellow': 'card-gradient-yellow',
  };
  return cards[type];
 };

 const getBadgeClass = (type: 'success' | 'error' | 'warning' | 'info') => {
  const badges = {
   success: 'badge-success',
   error: 'badge-error',
   warning: 'badge-warning',
   info: 'badge-info',
  };
  return badges[type];
 };

 const getTextGradientClass = (type: 'primary' | 'blue' | 'green') => {
  const gradients = {
   primary: 'gradient-text-primary',
   blue: 'gradient-text-blue',
   green: 'gradient-text-green',
  };
  return gradients[type];
 };

 const isDark = useMemo(() => {
  if (typeof window !== 'undefined') {
   return document.documentElement.classList.contains('dark');
  }
  return false;
 }, []);

 const toggleTheme = () => {
  if (typeof window !== 'undefined') {
   document.documentElement.classList.toggle('dark');
  }
 };

 const value: ThemeContextType = {
  getGradientClass,
  getIconContainerClass,
  getButtonClass,
  getCardClass,
  getBadgeClass,
  getTextGradientClass,
  isDark,
  toggleTheme,
 };

 return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
 const context = useContext(ThemeContext);
 if (context === undefined) {
  throw new Error('useTheme must be used within a ThemeProvider');
 }
 return context;
}
