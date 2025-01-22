import { useTheme } from '../context/ThemeContext'

export function ThemeToggle() {
  const { isPowerMode, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center w-full p-3 rounded transition-all
        ${isPowerMode ? 
          'font-brush text-xl bg-electric-purple text-toxic-yellow border-2 border-hot-pink hover:bg-hot-pink transform hover:scale-105 hover:rotate-2' : 
          'bg-gray-700 text-white hover:bg-gray-600'
        }
      `}
    >
      <span className={`mr-3 ${isPowerMode ? 'animate-spin' : ''}`}>
        {isPowerMode ? '🤪' : '🎨'}
      </span>
      {isPowerMode ? 'POWER MODE!' : 'Light Mode'}
    </button>
  )
} 