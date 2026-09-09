/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        fantasy: {
          bg: '#0a0e17',
          surface: '#111827',
          card: '#1a2234',
          border: '#2a364f',
          gold: '#f59e0b',
          goldLight: '#fbbf24',
          amber: '#f59e0b',
          sapphire: '#3b82f6',
          emerald: '#10b981',
          ruby: '#ef4444',
          ocean: '#0f172a',
          parchment: '#fef3c7',
        },
        catan: {
          burgundy: '#851d1d',
          burgundyDark: '#540f0f',
          burgundyDeep: '#380a0a',
          gold: '#f3a928',
          goldLight: '#fed467',
          goldDark: '#ba770e',
          brown: '#281c15',
          brownDark: '#1b120c',
          brownLight: '#3d2c22',
          wood: '#59381e',
          parchment: '#f5edd7',
          parchmentDark: '#dfceaa',
        },
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(245, 158, 11, 0.4)',
        glowBlue: '0 0 20px -5px rgba(59, 130, 246, 0.4)',
        goldBevel: 'inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -2px 0 rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.5)',
        goldHex: '0 0 15px rgba(245, 169, 40, 0.5)',
      },
    },
  },
  plugins: [],
};
