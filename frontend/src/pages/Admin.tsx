import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useTheme } from '../context/ThemeContext'
import type { Database } from '../types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function Admin() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useUser()
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()

  useEffect(() => {
    if (!profile?.is_admin) {
      navigate('/dashboard')
      return
    }

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setUsers(data)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [profile, navigate])

  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !isAdmin })
        .eq('user_id', userId)

      if (error) throw error
      
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, is_admin: !isAdmin }
          : user
      ))
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('user_id', userId)

      if (error) throw error
      
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, is_active: !isActive }
          : user
      ))
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-2xl ${isPowerMode ? 'animate-spin text-hot-pink' : 'text-gray-600'}`}>
          {isPowerMode ? '🌀' : 'Loading...'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className={`text-3xl font-bold mb-6 ${
        isPowerMode ? 'text-hot-pink animate-pulse' : 'text-gray-900'
      }`}>
        {isPowerMode ? '👑 Super Admin Powers! 🎮' : 'User Administration'}
      </h1>
      
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${
          isPowerMode ? 'divide-hot-pink' : 'divide-gray-200'
        }`}>
          <thead className={isPowerMode ? 'bg-electric-purple' : 'bg-gray-50'}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className={isPowerMode ? 'hover:bg-neon-green/10' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        {user.first_name} {user.last_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${user.is_admin 
                      ? (isPowerMode ? 'bg-hot-pink text-toxic-yellow' : 'bg-purple-100 text-purple-800')
                      : (isPowerMode ? 'bg-electric-purple text-toxic-yellow' : 'bg-gray-100 text-gray-800')
                    }`}
                  >
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${user.is_active
                      ? (isPowerMode ? 'bg-neon-green text-electric-purple' : 'bg-green-100 text-green-800')
                      : (isPowerMode ? 'bg-eye-burn-orange text-toxic-yellow' : 'bg-red-100 text-red-800')
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => toggleUserAdmin(user.user_id, user.is_admin || false)}
                    className={`mr-2 px-3 py-1 rounded ${
                      isPowerMode
                        ? 'bg-hot-pink text-toxic-yellow hover:bg-electric-purple'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => toggleUserActive(user.user_id, user.is_active || false)}
                    className={`px-3 py-1 rounded ${
                      isPowerMode
                        ? 'bg-neon-green text-electric-purple hover:bg-eye-burn-orange'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 