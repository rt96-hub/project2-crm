import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import type { Database } from '../types/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']
type OrganizationType = Database['public']['Tables']['organization_types']['Row']
type OrganizationStatus = Database['public']['Tables']['organization_statuses']['Row']
type Priority = Database['public']['Tables']['priorities']['Row']

interface OrganizationWithDetails extends Organization {
  type_details: OrganizationType
  status_details: OrganizationStatus
  priority_details: Priority
  open_tickets_count: number
}

interface TicketCount {
  organization_id: string
  count: string // bigint is returned as string from Postgres
}

export function Customers() {
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()
  const [organizations, setOrganizations] = useState<OrganizationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      // Get all active organizations with their details
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          *,
          type_details:organization_types!customer_type_id(*),
          status_details:organization_statuses!customer_status_id(*),
          priority_details:priorities!default_priority_id(*)
        `)
        .eq('is_active', true)
        .order('name')

      if (orgsError) throw orgsError

      // Get ticket counts for each organization using stored procedure
      const { data: ticketCounts, error: ticketsError } = await supabase
        .rpc('get_organization_open_ticket_counts')

      if (ticketsError) throw ticketsError

      // Combine the data
      const organizationsWithCounts = orgsData.map(org => ({
        ...org,
        open_tickets_count: parseInt((ticketCounts as TicketCount[]).find(tc => tc.organization_id === org.id)?.count || '0')
      }))

      setOrganizations(organizationsWithCounts)
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageContainer title="Customers">
        <div className={`text-2xl ${isPowerMode ? 'animate-spin text-hot-pink' : 'text-gray-600'}`}>
          {isPowerMode ? '🌀' : 'Loading customers...'}
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Customers">
      <div className={`overflow-x-auto ${isPowerMode ? 'font-comic' : ''}`}>
        <table className={`min-w-full table-auto ${
          isPowerMode ? 
          'border-4 border-hot-pink bg-electric-purple text-toxic-yellow' : 
          'border border-gray-200'
        }`}>
          <thead>
            <tr className={`${
              isPowerMode ? 'bg-hot-pink/50' : 'bg-gray-100'
            }`}>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
              }`}>Name</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
              }`}>Type</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
              }`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
              }`}>Default Priority</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
              }`}>Open Tickets</th>
            </tr>
          </thead>
          <tbody>
            {organizations.length === 0 ? (
              <tr>
                <td 
                  colSpan={5} 
                  className={`px-6 py-8 text-center ${
                    isPowerMode ? 
                    'text-toxic-yellow font-comic animate-pulse' : 
                    'text-gray-500'
                  }`}
                >
                  {isPowerMode ? '🎪 No customers found! 🎭' : 'No customers found'}
                </td>
              </tr>
            ) : (
              organizations.map((org) => (
                <tr 
                  key={org.id} 
                  onClick={() => navigate(`/customers/${org.id}`)}
                  className={`cursor-pointer transition-all ${
                    isPowerMode ?
                    'hover:bg-neon-green hover:text-eye-burn-orange hover:scale-105 hover:-rotate-1' :
                    'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 border-b">
                    <div className="text-sm font-medium">{org.name}</div>
                  </td>
                  <td className="px-6 py-4 border-b">
                    <div className="text-sm">{org.type_details?.name || 'Not Set'}</div>
                  </td>
                  <td className="px-6 py-4 border-b">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isPowerMode ? 
                      'bg-neon-green text-electric-purple' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {org.status_details?.name || 'Not Set'}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b">
                    <div className="text-sm">{org.priority_details?.name || 'Not Set'}</div>
                  </td>
                  <td className="px-6 py-4 border-b">
                    <div className="text-sm">{org.open_tickets_count}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  )
} 