import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      sans: ['San Francisco', 'san-serif'],
    },
    backgroundImage: {
      'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      'gradient-conic':
        'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
    },
    extend: {
      colors: {
        'custom-bg': '#e9dfe1',
        'custom-border': '#e2d9db',
        e3e3e3: '#e3e3e3',
        e2d9db: '#e2d9db',
        eaeaea: '#eaeaea',
        '636363': '#636363',
        '4d4d4d': '#4d4d4d',
        '595959': '#595959',
        pending: '#FFBF00',
      },
      textColor: {
        'custom-text': '#4c4c4c',
      },
      borderWidth: {
        default: '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
        '6': '6px',
      },
    },
  },
  variants: {},
  plugins: [],
}
export default config
