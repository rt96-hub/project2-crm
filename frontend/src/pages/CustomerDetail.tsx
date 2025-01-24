import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PageContainer } from '../components/PageContainer'
import { useTheme } from '../context/ThemeContext'
import { useUser } from '../context/UserContext'
import { EditOrganizationPopout } from '../components/EditOrganizationPopout'
import type { Database } from '../types/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']
type OrganizationType = Database['public']['Tables']['organization_types']['Row']
type OrganizationStatus = Database['public']['Tables']['organization_statuses']['Row']
type Priority = Database['public']['Tables']['priorities']['Row']
type Ticket = Database['public']['Tables']['tickets']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface OrganizationWithDetails extends Organization {
  type_details: OrganizationType
  status_details: OrganizationStatus
  priority_details: Priority
}

interface ProfileInfo {
  user_id: string
  first_name: string | null
  last_name: string | null
}

interface UserWithOrg extends Profile {
  organizations?: Organization[]
}

export function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()
  const { profile } = useUser()
  const [organization, setOrganization] = useState<OrganizationWithDetails | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [users, setUsers] = useState<UserWithOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  
  // New state for ticket-related data
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [priorities, setPriorities] = useState<Record<string, string>>({})
  const [creators, setCreators] = useState<Record<string, ProfileInfo>>({})

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      
      try {
        // Fetch organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select(`
            *,
            type_details:organization_types!customer_type_id(*),
            status_details:organization_statuses!customer_status_id(*),
            priority_details:priorities!default_priority_id(*)
          `)
          .eq('id', id)
          .single()

        if (orgError) throw orgError
        setOrganization(orgData)

        // Fetch basic ticket data first
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('organization_id', id)
          .order('created_at', { ascending: false })

        if (ticketError) {
          console.error('Error fetching tickets:', ticketError)
          throw ticketError
        }
        
        setTickets(ticketData)

        // Fetch related ticket data
        if (ticketData && ticketData.length > 0) {
          const ticketStatusIds = [...new Set(ticketData.map(t => t.status_id))]
          const ticketPriorityIds = [...new Set(ticketData.map(t => t.priority_id))]
          const creatorIds = [...new Set(ticketData.map(t => t.creator_id))]

          // Fetch statuses
          const { data: statusData } = await supabase
            .from('statuses')
            .select('id, name')
            .or(`is_active.eq.true,id.in.(${ticketStatusIds.join(',')})`)
            .order('name')

          if (statusData) {
            const statusMap = statusData.reduce((acc, status) => ({
              ...acc,
              [status.id]: status.name
            }), {} as Record<string, string>)
            setStatuses(statusMap)
          }

          // Fetch priorities
          const { data: priorityData } = await supabase
            .from('priorities')
            .select('id, name')
            .or(`is_active.eq.true,id.in.(${ticketPriorityIds.join(',')})`)
            .order('name')

          if (priorityData) {
            const priorityMap = priorityData.reduce((acc, priority) => ({
              ...acc,
              [priority.id]: priority.name
            }), {} as Record<string, string>)
            setPriorities(priorityMap)
          }

          // Fetch creators
          if (creatorIds.length > 0) {
            const { data: creatorData } = await supabase
              .from('profiles')
              .select('user_id, first_name, last_name')
              .in('user_id', creatorIds)

            if (creatorData) {
              const creatorMap = creatorData.reduce((acc, profile) => ({
                ...acc,
                [profile.user_id]: profile
              }), {} as Record<string, ProfileInfo>)
              setCreators(creatorMap)
            }
          }
        }

        // Updated user fetching
        // First get the profile IDs for this organization
        const { data: orgUserData, error: orgUserError } = await supabase
          .from('organization_users')
          .select('profile_id')
          .eq('organization_id', id)

        if (orgUserError) {
          console.error('Error fetching organization users:', orgUserError)
          throw orgUserError
        }

        if (orgUserData && orgUserData.length > 0) {
          const userIds = orgUserData.map(ou => ou.profile_id)

          // Then fetch the full user profiles
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .in('user_id', userIds)
            .eq('is_active', true)

          if (userError) {
            console.error('Error fetching users:', userError)
            throw userError
          }

          // Add organization data to each user
          const usersWithOrg = userData.map(user => ({
            ...user,
            organizations: organization ? [organization] : []
          }))

          setUsers(usersWithOrg)
        } else {
          setUsers([])
        }

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, organization])

  const getCreatorName = (creatorId: string) => {
    const creator = creators[creatorId]
    if (!creator) return 'Loading...'
    return [creator.first_name, creator.last_name].filter(Boolean).join(' ') || 'Unknown'
  }

  if (loading) {
    return (
      <PageContainer title="Customer Details">
        <div className={`text-2xl ${isPowerMode ? 'animate-spin text-hot-pink' : 'text-gray-600'}`}>
          {isPowerMode ? '🌀' : 'Loading customer details...'}
        </div>
      </PageContainer>
    )
  }

  if (!organization) {
    return (
      <PageContainer title="Customer Details">
        <div className="text-red-600">
          Organization not found
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="">
      {/* Title and buttons row */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-semibold ${
          isPowerMode ? 'text-hot-pink animate-pulse' : 'text-gray-900'
        }`}>
          {organization.name}
        </h1>
        <div className="flex gap-2">
          {profile?.is_admin && (
            <button
              onClick={() => setIsEditOpen(true)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isPowerMode
                  ? 'bg-neon-green text-electric-purple hover:bg-hot-pink hover:text-toxic-yellow'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Edit Organization
            </button>
          )}
          <button
            onClick={() => navigate('/customers')}
            className={`px-4 py-2 rounded-lg font-medium ${
              isPowerMode
                ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Back to Customers
          </button>
        </div>
      </div>

      {/* Organization Details */}
      <div className={`mb-8 rounded-lg shadow p-6 ${
        isPowerMode ? 'bg-electric-purple border-4 border-hot-pink text-toxic-yellow' : 'bg-white'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${
          isPowerMode ? 'font-impact animate-pulse' : ''
        }`}>Organization Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-sm">{organization.description || 'No description available'}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Customer Since</h3>
            <p className="text-sm">
              {organization.customer_since 
                ? new Date(organization.customer_since).toLocaleDateString() 
                : 'Not set'}
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Type</h3>
            <span className={`px-2 py-1 text-sm rounded-full ${
              isPowerMode ? 'bg-neon-green text-electric-purple' : 'bg-blue-100 text-blue-800'
            }`}>
              {organization.type_details?.name || 'Not set'}
            </span>
          </div>
          <div>
            <h3 className="font-medium mb-2">Status</h3>
            <span className={`px-2 py-1 text-sm rounded-full ${
              isPowerMode ? 'bg-neon-green text-electric-purple' : 'bg-green-100 text-green-800'
            }`}>
              {organization.status_details?.name || 'Not set'}
            </span>
          </div>
          <div>
            <h3 className="font-medium mb-2">Total Contract</h3>
            <p className="text-sm">
              {organization.total_contract 
                ? `$${organization.total_contract.toLocaleString()}` 
                : 'Not set'}
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Default Priority</h3>
            <span className={`px-2 py-1 text-sm rounded-full ${
              isPowerMode ? 'bg-neon-green text-electric-purple' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {organization.priority_details?.name || 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Updated Tickets Table */}
      <div className={`mb-8 rounded-lg shadow ${
        isPowerMode ? 'bg-electric-purple border-4 border-hot-pink' : 'bg-white'
      }`}>
        <div className={`p-6 border-b ${
          isPowerMode ? 'border-hot-pink' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${
            isPowerMode ? 'text-toxic-yellow font-impact animate-pulse' : ''
          }`}>Tickets</h2>
        </div>
        <div className={`overflow-x-auto ${isPowerMode ? 'font-comic' : ''}`}>
          <table className="min-w-full">
            <thead>
              <tr className={isPowerMode ? 'bg-hot-pink/50' : 'bg-gray-50'}>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
                }`}>Title</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
                }`}>Status</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
                }`}>Priority</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
                }`}>Created By</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
                }`}>Created At</th>
              </tr>
            </thead>
            <tbody className={isPowerMode ? 'text-toxic-yellow' : 'divide-y divide-gray-200'}>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${
                    isPowerMode ? 'text-toxic-yellow font-comic animate-pulse' : 'text-gray-500'
                  }`}>
                    {isPowerMode ? '🎪 No tickets found! 🎭' : 'No tickets found'}
                  </td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr 
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`, { 
                      state: { from: `/customers/${id}` }
                    })}
                    className={`cursor-pointer transition-all ${
                      isPowerMode ?
                      'hover:bg-neon-green hover:text-eye-burn-orange hover:scale-105 hover:-rotate-1' :
                      'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4">{ticket.title}</td>
                    <td className="px-6 py-4">{statuses[ticket.status_id] || 'Loading...'}</td>
                    <td className="px-6 py-4">{priorities[ticket.priority_id] || 'Loading...'}</td>
                    <td className="px-6 py-4">{getCreatorName(ticket.creator_id)}</td>
                    <td className="px-6 py-4">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Updated Users Table */}
      <div className={`rounded-lg shadow ${
        isPowerMode ? 'bg-electric-purple border-4 border-hot-pink' : 'bg-white'
      }`}>
        <div className={`p-6 border-b ${
          isPowerMode ? 'border-hot-pink' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${
            isPowerMode ? 'text-toxic-yellow font-impact animate-pulse' : ''
          }`}>Users</h2>
        </div>
        <div className={`overflow-x-auto ${isPowerMode ? 'font-comic' : ''}`}>
          <table className="min-w-full">
            <thead>
              <tr className={isPowerMode ? 'bg-hot-pink/50' : 'bg-gray-50'}>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
                }`}>Name</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
                }`}>Email</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
                }`}>Job Title</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isPowerMode ? 'text-toxic-yellow font-impact text-xl animate-pulse' : 'text-gray-500'
                }`}>Work Phone</th>
              </tr>
            </thead>
            <tbody className={isPowerMode ? 'text-toxic-yellow' : 'divide-y divide-gray-200'}>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`px-6 py-8 text-center ${
                    isPowerMode ? 'text-toxic-yellow font-comic animate-pulse' : 'text-gray-500'
                  }`}>
                    {isPowerMode ? '🎪 No users found! 🎭' : 'No users found'}
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.user_id}>
                    <td className="px-6 py-4">
                      {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">{user.job_title || 'Not set'}</td>
                    <td className="px-6 py-4">{user.work_phone || 'Not set'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add EditOrganizationPopout at the bottom */}
      {organization && isEditOpen && (
        <EditOrganizationPopout
          organization={organization}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onOrganizationUpdated={async () => {
            setIsEditOpen(false)
            if (!id) return
            try {
              // Fetch organization details
              const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select(`
                  *,
                  type_details:organization_types!customer_type_id(*),
                  status_details:organization_statuses!customer_status_id(*),
                  priority_details:priorities!default_priority_id(*)
                `)
                .eq('id', id)
                .single()

              if (orgError) throw orgError
              setOrganization(orgData)
            } catch (error) {
              console.error('Error fetching organization:', error)
            }
          }}
        />
      )}
    </PageContainer>
  )
} 