/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#39FF14',
        'hot-pink': '#FF69B4',
        'electric-purple': '#9B30FF',
        'toxic-yellow': '#FFFF00',
        'eye-burn-orange': '#FF4500',
      },
      fontFamily: {
        'comic': ['"Comic Sans MS"', 'cursive'],
        'papyrus': ['Papyrus', 'fantasy'],
        'impact': ['Impact', 'Charcoal'],
        'brush': ['"Brush Script MT"', 'cursive'],
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        }
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite',
      }
    },
  },
  plugins: [],
} 