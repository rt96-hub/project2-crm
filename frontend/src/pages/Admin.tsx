import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useTheme } from '../context/ThemeContext'

export function Admin() {
  const { profile } = useUser()
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()

  useEffect(() => {
    if (!profile?.is_admin) {
      navigate('/dashboard')
      return
    }
  }, [profile, navigate])

  return (
    <div className="p-6">
      <h1 className={`text-3xl font-bold mb-6 ${
        isPowerMode ? 'text-hot-pink animate-pulse' : 'text-gray-900'
      }`}>
        {isPowerMode ? '👑 Super Admin Powers! 🎮' : 'User Administration'}
      </h1>

      <div className="flex flex-col gap-4 max-w-xs">
        <button
          onClick={() => navigate('/admin/users')}
          className={`px-4 py-2 rounded-lg font-medium text-left ${
            isPowerMode
              ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Manage Users
        </button>
        <button
          onClick={() => navigate('/admin/organizations')}
          className={`px-4 py-2 rounded-lg font-medium text-left ${
            isPowerMode
              ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Manage Organizations
        </button>
        <button
          onClick={() => navigate('/admin/ticket-statuses')}
          className={`px-4 py-2 rounded-lg font-medium text-left ${
            isPowerMode
              ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Edit Ticket Statuses
        </button>
        <button
          onClick={() => navigate('/admin/priorities')}
          className={`px-4 py-2 rounded-lg font-medium text-left ${
            isPowerMode
              ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Edit Priorities
        </button>
        <button
          onClick={() => navigate('/admin/org-types')}
          className={`px-4 py-2 rounded-lg font-medium text-left ${
            isPowerMode
              ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Edit Organization Types
        </button>
        <button
          onClick={() => navigate('/admin/org-statuses')}
          className={`px-4 py-2 rounded-lg font-medium text-left ${
            isPowerMode
              ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Edit Organization Statuses
        </button>
      </div>
    </div>
  )
} 