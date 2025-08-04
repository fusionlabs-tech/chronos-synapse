/** @type {import('tailwindcss').Config} */
module.exports = {
 darkMode: ['class'],
 content: [
  './pages/**/*.{ts,tsx}',
  './components/**/*.{ts,tsx}',
  './app/**/*.{ts,tsx}',
  './src/**/*.{ts,tsx}',
 ],
 theme: {
  container: {
   center: true,
   padding: '2rem',
   screens: {
    '2xl': '1400px',
   },
  },
  extend: {
   colors: {
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    primary: {
     DEFAULT: 'hsl(var(--primary))',
     foreground: 'hsl(var(--primary-foreground))',
     50: 'var(--primary-50)',
     100: 'var(--primary-100)',
     200: 'var(--primary-200)',
     300: 'var(--primary-300)',
     400: 'var(--primary-400)',
     500: 'var(--primary-500)',
     600: 'var(--primary-600)',
     700: 'var(--primary-700)',
     800: 'var(--primary-800)',
     900: 'var(--primary-900)',
    },
    secondary: {
     DEFAULT: 'hsl(var(--secondary))',
     foreground: 'hsl(var(--secondary-foreground))',
     50: 'var(--secondary-50)',
     100: 'var(--secondary-100)',
     200: 'var(--secondary-200)',
     300: 'var(--secondary-300)',
     400: 'var(--secondary-400)',
     500: 'var(--secondary-500)',
     600: 'var(--secondary-600)',
     700: 'var(--secondary-700)',
     800: 'var(--secondary-800)',
     900: 'var(--secondary-900)',
    },
    destructive: {
     DEFAULT: 'hsl(var(--destructive))',
     foreground: 'hsl(var(--destructive-foreground))',
    },
    muted: {
     DEFAULT: 'hsl(var(--muted))',
     foreground: 'hsl(var(--muted-foreground))',
    },
    accent: {
     DEFAULT: 'hsl(var(--accent))',
     foreground: 'hsl(var(--accent-foreground))',
     blue: {
      50: 'var(--accent-blue-50)',
      100: 'var(--accent-blue-100)',
      500: 'var(--accent-blue-500)',
      600: 'var(--accent-blue-600)',
      700: 'var(--accent-blue-700)',
     },
     green: {
      50: 'var(--accent-green-50)',
      100: 'var(--accent-green-100)',
      500: 'var(--accent-green-500)',
      600: 'var(--accent-green-600)',
      700: 'var(--accent-green-700)',
     },
     orange: {
      50: 'var(--accent-orange-50)',
      100: 'var(--accent-orange-100)',
      500: 'var(--accent-orange-500)',
      600: 'var(--accent-orange-600)',
      700: 'var(--accent-orange-700)',
     },
     red: {
      50: 'var(--accent-red-50)',
      100: 'var(--accent-red-100)',
      500: 'var(--accent-red-500)',
      600: 'var(--accent-red-600)',
      700: 'var(--accent-red-700)',
     },
     yellow: {
      50: 'var(--accent-yellow-50)',
      100: 'var(--accent-yellow-100)',
      500: 'var(--accent-yellow-500)',
      600: 'var(--accent-yellow-600)',
      700: 'var(--accent-yellow-700)',
     },
    },
    popover: {
     DEFAULT: 'hsl(var(--popover))',
     foreground: 'hsl(var(--popover-foreground))',
    },
    card: {
     DEFAULT: 'hsl(var(--card))',
     foreground: 'hsl(var(--card-foreground))',
    },
    neutral: {
     50: 'var(--neutral-50)',
     100: 'var(--neutral-100)',
     200: 'var(--neutral-200)',
     300: 'var(--neutral-300)',
     400: 'var(--neutral-400)',
     500: 'var(--neutral-500)',
     600: 'var(--neutral-600)',
     700: 'var(--neutral-700)',
     800: 'var(--neutral-800)',
     900: 'var(--neutral-900)',
    },
   },
   borderRadius: {
    lg: 'var(--radius)',
    md: 'calc(var(--radius) - 2px)',
    sm: 'calc(var(--radius) - 4px)',
   },
   keyframes: {
    'accordion-down': {
     from: { height: 0 },
     to: { height: 'var(--radix-accordion-content-height)' },
    },
    'accordion-up': {
     from: { height: 'var(--radix-accordion-content-height)' },
     to: { height: 0 },
    },
   },
   animation: {
    'accordion-down': 'accordion-down 0.2s ease-out',
    'accordion-up': 'accordion-up 0.2s ease-out',
   },
   backgroundImage: {
    'gradient-primary':
     'linear-gradient(135deg, var(--primary-500) 0%, var(--secondary-500) 100%)',
    'gradient-primary-hover':
     'linear-gradient(135deg, var(--primary-600) 0%, var(--secondary-600) 100%)',
    'gradient-blue':
     'linear-gradient(135deg, var(--accent-blue-500) 0%, var(--accent-blue-600) 100%)',
    'gradient-green':
     'linear-gradient(135deg, var(--accent-green-500) 0%, var(--accent-green-600) 100%)',
    'gradient-orange':
     'linear-gradient(135deg, var(--accent-orange-500) 0%, var(--accent-orange-600) 100%)',
    'gradient-red':
     'linear-gradient(135deg, var(--accent-red-500) 0%, var(--accent-red-600) 100%)',
    'gradient-yellow':
     'linear-gradient(135deg, var(--accent-yellow-500) 0%, var(--accent-yellow-600) 100%)',
   },
   boxShadow: {
    'theme-sm': 'var(--shadow-sm)',
    'theme-md': 'var(--shadow-md)',
    'theme-lg': 'var(--shadow-lg)',
    'theme-xl': 'var(--shadow-xl)',
   },
  },
 },
 plugins: [require('tailwindcss-animate')],
};
