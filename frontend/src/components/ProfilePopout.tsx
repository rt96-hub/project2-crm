import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'

interface ProfilePopoutProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfilePopout({ isOpen, onClose }: ProfilePopoutProps) {
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!isOpen) return null

  const menuItems = [
    { label: 'Profile Settings', icon: isPowerMode ? '🎭' : '⚙️' },
    { label: 'Preferences', icon: isPowerMode ? '🎪' : '🔧' },
    { label: 'Help & Support', icon: isPowerMode ? '🤡' : '❓' },
  ]

  return (
    <div className={`absolute bottom-16 left-4 w-56 rounded-lg shadow-lg p-2 ${
      isPowerMode ?
      'bg-electric-purple border-4 border-hot-pink animate-wiggle' :
      'bg-gray-700'
    }`}>
      <div className="space-y-2">
        {menuItems.map((item, index) => (
          <button 
            key={item.label}
            className={`w-full text-left px-4 py-2 rounded transition-all ${
              isPowerMode ?
              'text-toxic-yellow font-comic hover:bg-neon-green hover:text-eye-burn-orange hover:scale-105 hover:-rotate-2' :
              'text-white hover:bg-gray-600'
            }`}
            style={isPowerMode ? {
              animationDelay: `${index * 150}ms`,
              transform: `rotate(${Math.random() * 2 - 1}deg)`
            } : {}}
          >
            <span className={`mr-2 ${isPowerMode ? 'animate-bounce inline-block' : ''}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
        <hr className={isPowerMode ? 'border-hot-pink border-2' : 'border-gray-600'} />
        <button
          onClick={handleLogout}
          className={`w-full text-left px-4 py-2 rounded transition-all ${
            isPowerMode ?
            'text-eye-burn-orange font-impact hover:bg-hot-pink hover:text-toxic-yellow hover:scale-105 hover:rotate-2 animate-pulse' :
            'text-red-400 hover:bg-gray-600'
          }`}
        >
          <span className={`mr-2 ${isPowerMode ? 'animate-spin inline-block' : ''}`}>
            {isPowerMode ? '💥' : '🚪'}
          </span>
          Logout
        </button>
      </div>
    </div>
  )
} 