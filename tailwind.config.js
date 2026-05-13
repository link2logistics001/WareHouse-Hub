/**
 * tailwind.config.js — Tailwind CSS Configuration
 *
 * Defines the design system for the Link2Logistics platform including:
 *  - **Content paths**: Tells Tailwind which files to scan for class usage (tree-shaking)
 *  - **Custom fonts**: Uses Fira Sans as the primary font (loaded via CSS variable from layout.js)
 *  - **Brand colors**: Custom orange primary palette and accent colors (amber, emerald)
 *  - **Animations**: Custom fade-in and slide-up keyframe animations for page transitions
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  /**
   * Content paths — Tailwind scans these files to detect which CSS classes
   * are actually used, then purges unused classes in production builds.
   */
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /**
       * Font families — maps to the CSS variable set in layout.js via
       * next/font/google (Fira_Sans). Falls back to system-ui and sans-serif.
       */
      fontFamily: {
        sans: ['var(--font-fira-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fira-sans)', 'system-ui', 'sans-serif'],
      },

      /**
       * Custom brand color palette.
       * Primary orange (50–950) matches the Link2Logistics brand identity.
       * Accent colors provide complementary highlights for success/warning states.
       */
      colors: {
        primary: {
          50: '#fff5ed',
          100: '#ffe8d5',
          200: '#fecda8',
          300: '#fdaa70',
          400: '#fb7c37',
          500: '#f97316',  // Main brand orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        accent: {
          amber: '#f59e0b',    // Used for warnings, highlights
          emerald: '#10b981',  // Used for success states, verified badges
        },
      },

      /**
       * Custom animations used across landing page sections.
       * - fade-in: Simple opacity transition for element reveals
       * - slide-up: Combined opacity + vertical movement for staggered reveals
       */
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
