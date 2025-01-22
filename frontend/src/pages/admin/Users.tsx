import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'
import { UserTable } from '../../components/UserTable'
import type { Database } from '../../types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

interface UserWithOrg extends Profile {
  organizations?: Organization[]
}

export function Users() {
  const [users, setUsers] = useState<UserWithOrg[]>([])
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
        // First get all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profilesError) throw profilesError

        // Then get organization associations for all users
        const { data: orgUsers, error: orgError } = await supabase
          .from('organization_users')
          .select(`
            profile_id,
            organization: organizations (
              id,
              name,
              created_at,
              customer_since,
              customer_status_id,
              customer_type_id,
              default_priority_id,
              description,
              is_active,
              total_contract,
              updated_at
            )
          `)

        if (orgError) throw orgError

        // Map organizations to users
        const usersWithOrgs = profiles.map(profile => ({
          ...profile,
          organizations: (orgUsers
            .filter(ou => ou.profile_id === profile.user_id)
            .map(ou => ou.organization)
            .filter(Boolean) as unknown as Organization[])
        }))

        setUsers(usersWithOrgs)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [profile, navigate])

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
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${
          isPowerMode ? 'text-hot-pink animate-pulse' : 'text-gray-900'
        }`}>
          {isPowerMode ? '👥 User Management 🎮' : 'User Management'}
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => {}} // TODO: Implement invite user functionality
            className={`px-4 py-2 rounded-lg font-medium ${
              isPowerMode
                ? 'bg-neon-green text-electric-purple hover:bg-hot-pink hover:text-toxic-yellow'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Invite User
          </button>
          <button
            onClick={() => navigate('/admin')}
            className={`px-4 py-2 rounded-lg font-medium ${
              isPowerMode
                ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Back to Admin
          </button>
        </div>
      </div>

      <UserTable 
        users={users} 
        onUserUpdate={(updatedUser) => {
          setUsers(users.map(user => 
            user.user_id === updatedUser.user_id ? updatedUser : user
          ))
        }} 
      />
    </div>
  )
} 