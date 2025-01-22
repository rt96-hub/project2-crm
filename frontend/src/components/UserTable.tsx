import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'
import { UserEditModal } from './UserEditModal'

type Profile = Database['public']['Tables']['profiles']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

interface UserWithOrg extends Profile {
  organizations?: Organization[]
}

export function UserTable({ users, onUserUpdate }: { 
  users: UserWithOrg[], 
  onUserUpdate: (updatedUser: UserWithOrg) => void 
}) {
  const { isPowerMode } = useTheme()
  const [selectedUser, setSelectedUser] = useState<UserWithOrg | null>(null)

  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !isAdmin })
        .eq('user_id', userId)

      if (error) throw error
      
      const updatedUser = users.find(u => u.user_id === userId)
      if (updatedUser) {
        onUserUpdate({ ...updatedUser, is_admin: !isAdmin })
      }
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
      
      const updatedUser = users.find(u => u.user_id === userId)
      if (updatedUser) {
        onUserUpdate({ ...updatedUser, is_active: !isActive })
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleUserUpdate = (updatedUser: UserWithOrg) => {
    onUserUpdate(updatedUser)
    setSelectedUser(null)
  }

  const getUserRole = (user: UserWithOrg) => {
    if (user.is_admin) return 'Admin'
    if (user.is_customer) return 'Customer'
    return 'User'
  }

  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'Admin':
        return isPowerMode 
          ? 'bg-hot-pink text-toxic-yellow' 
          : 'bg-purple-100 text-purple-800'
      case 'Customer':
        return isPowerMode
          ? 'bg-neon-green text-electric-purple'
          : 'bg-green-100 text-green-800'
      default:
        return isPowerMode
          ? 'bg-electric-purple text-toxic-yellow'
          : 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${
          isPowerMode ? 'divide-hot-pink' : 'divide-gray-200'
        }`}>
          <thead className={isPowerMode ? 'bg-electric-purple' : 'bg-gray-50'}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => {
              const role = getUserRole(user)
              return (
                <tr key={user.user_id} className={isPowerMode ? 'hover:bg-neon-green/10' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleStyles(role)}`}>
                      {role}
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
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {user.organizations && user.organizations.length > 0 
                        ? user.organizations.map(org => org.name).join(', ')
                        : 'None'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className={`mr-2 px-3 py-1 rounded ${
                        isPowerMode
                          ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Edit
                    </button>
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
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={handleUserUpdate}
        />
      )}
    </>
  )
} 