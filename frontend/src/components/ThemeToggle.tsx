'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
 const { isDark, toggleTheme } = useTheme();

 return (
  <Button
   variant='outline'
   size='sm'
   onClick={toggleTheme}
   className='btn-secondary'
  >
   {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
  </Button>
 );
}
