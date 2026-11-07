import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { primary: '#0C16A6', teal: '#647D7B', purple: '#5C5676', lavender: '#B5A8C2' }, boxShadow: { card: '0 10px 30px rgba(27, 35, 83, .06)' } } },
  plugins: [],
} satisfies Config
