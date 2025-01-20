import { useTheme } from '../context/ThemeContext'

export function ThemeToggle() {
  const { isPowerMode, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        fixed top-4 right-4 z-50 px-4 py-2 rounded-full font-comic text-lg
        transition-all duration-300 transform hover:scale-110
        ${isPowerMode ? 
          'bg-electric-purple text-toxic-yellow border-4 border-hot-pink animate-pulse shadow-[0_0_15px_5px_#FF69B4]' : 
          'bg-gray-200 text-gray-800 border border-gray-300 hover:bg-gray-300'
        }
      `}
    >
      {isPowerMode ? '🤪 POWER MODE! 🤪' : '😊 Regular Mode 😊'}
    </button>
  )
} 