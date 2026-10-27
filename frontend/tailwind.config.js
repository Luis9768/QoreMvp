/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        qore: {
          dark: '#282D2F',
          sidebar: '#2D3133',
          surface: '#3C3F40',
          canvas: '#E5E8ED',
          canvasLight: '#F7F9FB',
          card: '#FFFFFF',
          cardSubtle: '#FDFDFD',
          orange: '#EA7913',
          orangeHover: '#D56A0C',
          orangeLight: '#FFE3C9',
          orangeDark: '#944A00',
          green: '#49CC90',
          greenLight: '#ECFDF5',
          greenDark: '#047857',
          red: '#F93E3E',
          redLight: '#FEF2F2',
          redDark: '#B91C1C',
          blue: '#61AFF2',
          blueLight: '#EFF6FF',
          blueDark: '#1D4ED8',
          warning: '#FCA130',
          border: '#D8DADC',
          borderSubtle: '#E2E8F0',
          textMain: '#191C1E',
          textMuted: '#565E74',
        }
      },
      boxShadow: {
        'qore-card': '4px 4px 10px 0px rgba(0, 0, 0, 0.08), -2px -2px 2px 0px rgba(255, 255, 255, 0.8)',
        'qore-elevation': '0px 4px 12px 0px rgba(0, 0, 0, 0.08)',
        'qore-btn': '0px 4px 4px 0px rgba(0, 0, 0, 0.15)',
        'qore-inner': 'inset 2px 2px 5px 0px rgba(0, 0, 0, 0.12)',
        'qore-sheet': '0px -8px 24px 0px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
