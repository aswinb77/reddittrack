/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cred: {
          bg: '#080808',
          card: '#111113',
          cardHover: '#161619',
          border: '#222226',
          borderLight: '#303036',
          textMuted: '#73737C',
          textSub: '#A1A1AA',
          textWhite: '#F4F4F5',
          gold: '#E5B869',
          emerald: '#34D399',
          crimson: '#F43F5E',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      letterSpacing: {
        widest: '0.2em',
        ultra: '0.25em',
      }
    },
  },
  plugins: [],
}

