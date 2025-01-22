import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { OrganizationTable, OrganizationWithDetails } from '../../components/OrganizationTable'
import { CreateOrganizationPopout } from '../../components/CreateOrganizationPopout'
import { EditOrganizationPopout } from '../../components/EditOrganizationPopout'

export function Organizations() {
  const { profile } = useUser()
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()
  const [organizations, setOrganizations] = useState<OrganizationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationWithDetails | null>(null)

  useEffect(() => {
    if (!profile?.is_admin) {
      navigate('/dashboard')
      return
    }
  }, [profile, navigate])

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          type_details:organization_types!customer_type_id(*),
          status_details:organization_statuses!customer_status_id(*),
          priority_details:priorities!default_priority_id(*)
        `)
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrganizationUpdate = (updatedOrg: OrganizationWithDetails) => {
    setOrganizations(organizations.map(org => 
      org.id === updatedOrg.id ? updatedOrg : org
    ))
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
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${
          isPowerMode ? 'text-hot-pink animate-pulse' : 'text-gray-900'
        }`}>
          {isPowerMode ? '🏢 Organization Management 🚀' : 'Organization Management'}
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => setIsCreateOpen(true)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isPowerMode
                ? 'bg-neon-green text-electric-purple hover:bg-hot-pink hover:text-toxic-yellow'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            New Organization
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

      <OrganizationTable 
        organizations={organizations} 
        onEditOrganization={setSelectedOrganization}
        onOrganizationUpdate={handleOrganizationUpdate}
      />

      <CreateOrganizationPopout
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onOrganizationCreated={fetchOrganizations}
      />

      {selectedOrganization && (
        <EditOrganizationPopout
          organization={selectedOrganization}
          isOpen={true}
          onClose={() => setSelectedOrganization(null)}
          onOrganizationUpdated={fetchOrganizations}
        />
      )}
    </div>
  )
}
