import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

interface UserWithOrg extends Profile {
  organizations?: Organization[]
}

interface UserEditModalProps {
  user: UserWithOrg
  onClose: () => void
  onSave: (updatedUser: UserWithOrg) => void
}

export function UserEditModal({ user, onClose, onSave }: UserEditModalProps) {
  const { isPowerMode } = useTheme()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email,
    job_title: user.job_title || '',
    work_phone: user.work_phone || '',
    is_customer: user.is_customer || false,
  })

  // Fetch active organizations and current user's organization
  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (orgs) {
        setOrganizations(orgs)
      }

      if (user.is_customer) {
        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('profile_id', user.user_id)
          .single()

        if (orgUser) {
          setSelectedOrgId(orgUser.organization_id)
        }
      }
    }

    fetchOrganizations()
  }, [user.is_customer, user.user_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user.user_id)

      if (profileError) throw profileError

      let updatedOrganizations: Organization[] = []

      // Handle organization_users table
      if (formData.is_customer && selectedOrgId) {
        // Delete any existing organization_users entries
        await supabase
          .from('organization_users')
          .delete()
          .eq('profile_id', user.user_id)

        // Create new organization_user entry
        const { error: orgUserError } = await supabase
          .from('organization_users')
          .insert({
            profile_id: user.user_id,
            organization_id: selectedOrgId,
          })

        if (orgUserError) throw orgUserError

        // Fetch the selected organization details
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', selectedOrgId)
          .single()

        if (org) {
          updatedOrganizations = [org]
        }
      } else if (!formData.is_customer) {
        // Delete any existing organization_users entries if user is no longer a customer
        await supabase
          .from('organization_users')
          .delete()
          .eq('profile_id', user.user_id)
      }

      // Pass back the updated user with organizations
      onSave({ 
        ...user, 
        ...formData, 
        organizations: updatedOrganizations 
      })
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full p-6 ${
        isPowerMode ? 'border-4 border-hot-pink' : ''
      }`}>
        <h2 className={`text-2xl font-bold mb-4 ${
          isPowerMode ? 'text-hot-pink' : 'text-gray-900'
        }`}>
          Edit User Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Work Phone
            </label>
            <input
              type="tel"
              value={formData.work_phone}
              onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_customer"
              checked={formData.is_customer}
              onChange={(e) => {
                setFormData({ ...formData, is_customer: e.target.checked })
                if (!e.target.checked) {
                  setSelectedOrgId(null)
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_customer" className="ml-2 block text-sm text-gray-900">
              Is Customer
            </label>
          </div>

          {formData.is_customer && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization
              </label>
              <select
                value={selectedOrgId || ''}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={formData.is_customer}
              >
                <option value="">Select an organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium ${
                isPowerMode
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg font-medium ${
                isPowerMode
                  ? 'bg-hot-pink text-white hover:bg-electric-purple'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 