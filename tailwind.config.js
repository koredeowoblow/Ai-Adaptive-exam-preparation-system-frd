/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
          border: 'var(--color-primary-border)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          light: 'var(--color-accent-light)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
          light: 'var(--color-success-light)',
        },
        background: {
          DEFAULT: 'var(--color-background)',
          soft: 'var(--color-background-soft)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          light: 'var(--color-text-light)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          light: 'var(--color-danger-light)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
        },
        // Metric card backgrounds (brief spec)
        'elo-bg':     'var(--color-elo-bg)',
        'topics-bg':  'var(--color-topics-bg)',
        'streak-bg':  'var(--color-streak-bg)',
        'courses-bg': 'var(--color-courses-bg)',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        'xs':  'var(--spacing-xs)',
        'sm':  'var(--spacing-sm)',
        'md':  'var(--spacing-md)',
        'lg':  'var(--spacing-lg)',
        'xl':  'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
        '4xl': 'var(--spacing-4xl)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },
      boxShadow: {
        // 4-level elevation system
        '1':     'var(--shadow-1)',
        '2':     'var(--shadow-2)',
        '3':     'var(--shadow-3)',
        '4':     'var(--shadow-4)',
        // Legacy aliases
        'sm':    'var(--shadow-1)',
        'md':    'var(--shadow-2)',
        'lg':    'var(--shadow-3)',
        'float': 'var(--shadow-4)',
        // Brand-color shadows
        'blue':  'var(--shadow-blue)',
        'green': 'var(--shadow-green)',
        'gold':  'var(--shadow-gold)',
        'glow':  'var(--shadow-glow)',
      },
      fontFamily: {
        sans:   ['"DM Sans"', 'Inter', 'Segoe UI', '-apple-system', 'sans-serif'],
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        body:   ['"DM Sans"', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
