import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface ProfilePopoutProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfilePopout({ isOpen, onClose }: ProfilePopoutProps) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!isOpen) return null

  return (
    <div className="absolute bottom-16 left-4 w-56 bg-gray-700 rounded-lg shadow-lg p-2 text-white">
      <div className="space-y-2">
        <button className="w-full text-left px-4 py-2 hover:bg-gray-600 rounded">
          Profile Settings
        </button>
        <button className="w-full text-left px-4 py-2 hover:bg-gray-600 rounded">
          Preferences
        </button>
        <button className="w-full text-left px-4 py-2 hover:bg-gray-600 rounded">
          Help & Support
        </button>
        <hr className="border-gray-600" />
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 hover:bg-gray-600 rounded text-red-400"
        >
          Logout
        </button>
      </div>
    </div>
  )
} 