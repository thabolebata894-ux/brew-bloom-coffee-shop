/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ember: {
          charcoal: '#FAF8F5',
          panel: '#FFFFFF',
          raised: '#F4EEE5',
          copper: '#C85A38',
          gold: '#A66A2C',
          ivory: '#2C2A29',
          muted: '#8A8178',
          line: '#E9E0D5'
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Arial', 'sans-serif']
      },
      boxShadow: {
        ember: '0 24px 70px rgb(44 42 41 / 16%)',
        copper: '0 10px 35px rgb(200 90 56 / 14%)'
      },
      keyframes: {
        'draw-cup': {
          '0%': { strokeDashoffset: '420', opacity: '0.25' },
          '65%': { strokeDashoffset: '0', opacity: '1' },
          '100%': { strokeDashoffset: '0', opacity: '0.9' }
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'check-draw': {
          '0%': { strokeDashoffset: '44' },
          '100%': { strokeDashoffset: '0' }
        },
        'soft-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(200 90 56 / 0%)' },
          '50%': { boxShadow: '0 0 0 14px rgb(200 90 56 / 7%)' }
        }
      },
      animation: {
        'draw-cup': 'draw-cup 1.15s ease-in-out both',
        'fade-up': 'fade-up 650ms cubic-bezier(.2,.7,.2,1) both',
        'check-draw': 'check-draw 600ms ease-out 180ms both',
        'soft-pulse': 'soft-pulse 2.4s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
