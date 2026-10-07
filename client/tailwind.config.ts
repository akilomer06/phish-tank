import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: Object.fromEntries(
        [
          'bg-0',
          'bg-1',
          'bg-2',
          'border',
          'green',
          'cyan',
          'magenta',
          'amber',
          'violet',
          'text-1',
          'text-2',
          'text-3',
        ].map((key) => [key, `var(--${key})`]),
      ),
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '20px',
        xl: '28px',
        '2xl': '40px',
        '3xl': '64px',
      },
      borderRadius: { card: '20px', button: '14px' },
      boxShadow: Object.fromEntries(
        ['green', 'cyan', 'magenta', 'amber', 'violet'].map((key) => [
          key,
          `var(--glow-${key})`,
        ]),
      ),
    },
  },
  plugins: [],
} satisfies Config;
