import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']
type OrganizationType = Database['public']['Tables']['organization_types']['Row']
type OrganizationStatus = Database['public']['Tables']['organization_statuses']['Row']
type Priority = Database['public']['Tables']['priorities']['Row']

export interface OrganizationWithDetails extends Organization {
  type_details: OrganizationType
  status_details: OrganizationStatus
  priority_details: Priority
}

interface OrganizationTableProps {
  organizations: OrganizationWithDetails[]
  onEditOrganization: (organization: OrganizationWithDetails) => void
  onOrganizationUpdate: (updatedOrg: OrganizationWithDetails) => void
}

export function OrganizationTable({ 
  organizations,
  onEditOrganization,
  onOrganizationUpdate
}: OrganizationTableProps) {
  const { isPowerMode } = useTheme()

  const toggleOrganizationActive = async (orgId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: !isActive })
        .eq('id', orgId)

      if (error) throw error
      
      const updatedOrg = organizations.find(o => o.id === orgId)
      if (updatedOrg) {
        onOrganizationUpdate({ ...updatedOrg, is_active: !isActive })
      }
    } catch (error) {
      console.error('Error updating organization:', error)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y ${
        isPowerMode ? 'divide-hot-pink' : 'divide-gray-200'
      }`}>
        <thead className={isPowerMode ? 'bg-electric-purple' : 'bg-gray-50'}>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Priority</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Active</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {organizations.map((org) => (
            <tr key={org.id} className={isPowerMode ? 'hover:bg-neon-green/10' : 'hover:bg-gray-50'}>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{org.name}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{org.type_details?.name || 'Not Set'}</div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  isPowerMode 
                    ? 'bg-neon-green text-electric-purple' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {org.status_details?.name || 'Not Set'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{org.priority_details?.name || 'Not Set'}</div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  org.is_active
                    ? (isPowerMode ? 'bg-neon-green text-electric-purple' : 'bg-green-100 text-green-800')
                    : (isPowerMode ? 'bg-hot-pink text-toxic-yellow' : 'bg-red-100 text-red-800')
                }`}>
                  {org.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <button
                  onClick={() => onEditOrganization(org)}
                  className={`mr-2 px-3 py-1 rounded ${
                    isPowerMode
                      ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleOrganizationActive(org.id, org.is_active)}
                  className={`px-3 py-1 rounded ${
                    isPowerMode
                      ? 'bg-neon-green text-electric-purple hover:bg-hot-pink hover:text-toxic-yellow'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {org.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 