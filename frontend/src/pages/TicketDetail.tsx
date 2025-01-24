import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { PageContainer } from '../components/PageContainer'
import { Tables } from '../types/database.types'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TicketActivitySidebar } from '../components/TicketActivitySidebar'
import { ConversationSidebar } from '../components/ConversationSidebar'
import { EditTicketPopout } from '../components/EditTicketPopout'

type ProfileInfo = {
  user_id: string
  first_name: string | null
  last_name: string | null
}

type AssigneeData = {
  ticket_id: string
  assignee_id: string
  first_name: string | null
  last_name: string | null
}

export function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isPowerMode } = useTheme()
  const [ticket, setTicket] = useState<Tables<'tickets'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [priorities, setPriorities] = useState<Record<string, string>>({})
  const [creator, setCreator] = useState<ProfileInfo | null>(null)
  const [assignees, setAssignees] = useState<ProfileInfo[]>([])
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const [isActivitySidebarOpen, setIsActivitySidebarOpen] = useState(false)
  const [isConversationSidebarOpen, setIsConversationSidebarOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [organization, setOrganization] = useState<Tables<'organizations'> | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!id) return

      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*, organizations(*)')
        .eq('id', id)
        .single()

      if (ticketError) {
        console.error('Error fetching ticket:', ticketError)
      } else {
        setTicket(ticketData)
        setOrganization(ticketData.organizations)

        // Fetch creator info
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .eq('user_id', ticketData.creator_id)
          .single()

        if (creatorData) {
          setCreator(creatorData)
        }

        // Fetch assignees using the new function
        const { data: assigneeData, error: assigneeError } = await supabase
          .rpc('get_ticket_assignees', { ticket_ids: [id] })

        if (assigneeError) {
          setAssignmentError(assigneeError.message)
          setAssignees([])
        } else if (assigneeData) {
          // Transform assignee data into ProfileInfo array
          const profileInfos = assigneeData.map((assignee: AssigneeData) => ({
            user_id: assignee.assignee_id,
            first_name: assignee.first_name,
            last_name: assignee.last_name
          }))
          setAssignees(profileInfos)
          setAssignmentError(null)
        } else {
          setAssignees([])
          setAssignmentError(null)
        }
      }

      // Fetch statuses
      const { data: statusData } = await supabase
        .from('statuses')
        .select('id, name')

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

      if (priorityData) {
        const priorityMap = priorityData.reduce((acc, priority) => ({
          ...acc,
          [priority.id]: priority.name
        }), {} as Record<string, string>)
        setPriorities(priorityMap)
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  // Determine the return path and label based on the previous location
  const getReturnInfo = () => {
    const path = location.state?.from || '/tickets'
    const label = path.includes('customers') ? 'Customer Details' : 'Tickets'
    return { path, label }
  }

  if (loading) {
    return (
      <PageContainer 
        title="Loading Ticket..."
        onBack={() => navigate(getReturnInfo().path)}
      >
        <div className={`animate-pulse ${
          isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'
        }`}>
          Loading...
        </div>
      </PageContainer>
    )
  }

  if (!ticket) {
    return (
      <PageContainer 
        title="Ticket Not Found"
        onBack={() => navigate(getReturnInfo().path)}
      >
        <div className={isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'}>
          Could not find ticket with ID: {id}
        </div>
      </PageContainer>
    )
  }

  const getFullName = (profile: ProfileInfo | null) => {
    if (!profile) return 'Unknown'
    return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown'
  }

  return (
    <>
      <PageContainer 
        title={`Ticket: ${ticket.title}`}
        onBack={() => navigate(getReturnInfo().path)}
        actionButton={
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditOpen(true)}
              className={`px-4 py-2 rounded-lg transition-all ${
                isPowerMode ?
                'bg-hot-pink text-toxic-yellow hover:bg-pink-600 font-comic' :
                'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setIsConversationSidebarOpen(true)}
              className={`px-4 py-2 rounded-lg transition-all ${
                isPowerMode ?
                'bg-hot-pink text-toxic-yellow hover:bg-pink-600 font-comic' :
                'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Conversation
            </button>
            <button
              onClick={() => setIsActivitySidebarOpen(true)}
              className={`px-4 py-2 rounded-lg transition-all ${
                isPowerMode ?
                'bg-hot-pink text-toxic-yellow hover:bg-pink-600 font-comic' :
                'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => navigate(getReturnInfo().path)}
              className={`px-4 py-2 rounded-lg transition-all ${
                isPowerMode ?
                'bg-hot-pink text-toxic-yellow hover:bg-pink-600 font-comic' :
                'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Return to {getReturnInfo().label}
            </button>
          </div>
        }
      >
        <div className={`h-full flex flex-col space-y-4 ${isPowerMode ? 'font-comic' : ''} ${
          isActivitySidebarOpen || isConversationSidebarOpen ? 'mr-96' : ''
        }`}>
          {/* Status Row */}
          <div className={`grid grid-cols-4 gap-4 ${
            isPowerMode ? 'bg-electric-purple rounded-lg p-4' : 'bg-gray-50 rounded-lg p-4'
          }`}>
            <div className={`${
              isPowerMode ? 'border-2 border-hot-pink' : 'border border-gray-200'
            } rounded-lg p-3`}>
              <div className={`text-sm font-semibold ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'}`}>
                Status
              </div>
              <div className={isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'}>
                {statuses[ticket.status_id] || 'Loading...'}
              </div>
            </div>
            <div className={`${
              isPowerMode ? 'border-2 border-hot-pink' : 'border border-gray-200'
            } rounded-lg p-3`}>
              <div className={`text-sm font-semibold ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'}`}>
                Priority
              </div>
              <div className={isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'}>
                {priorities[ticket.priority_id] || 'Loading...'}
              </div>
            </div>
            <div className={`${
              isPowerMode ? 'border-2 border-hot-pink' : 'border border-gray-200'
            } rounded-lg p-3`}>
              <div className={`text-sm font-semibold ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'}`}>
                Created
              </div>
              <div className={isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'}>
                {new Date(ticket.created_at).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div className={`${
              isPowerMode ? 'border-2 border-hot-pink' : 'border border-gray-200'
            } rounded-lg p-3`}>
              <div className={`text-sm font-semibold ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'}`}>
                Due Date
              </div>
              <div className={isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'}>
                {ticket.due_date ? new Date(ticket.due_date).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'No due date'}
              </div>
            </div>
          </div>

          {/* People Row */}
          <div className={`grid grid-cols-3 gap-4 ${
            isPowerMode ? 'bg-electric-purple rounded-lg p-4' : 'bg-gray-50 rounded-lg p-4'
          }`}>
            <div className={`${
              isPowerMode ? 'border-2 border-hot-pink' : 'border border-gray-200'
            } rounded-lg p-3`}>
              <div className={`text-sm font-semibold ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'}`}>
                Creator
              </div>
              <div className={isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'}>
                {creator ? getFullName(creator) : 'Loading...'}
              </div>
            </div>
            <div className={`${
              isPowerMode ? 'border-2 border-hot-pink' : 'border border-gray-200'
            } rounded-lg p-3`}>
              <div className={`text-sm font-semibold ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'}`}>
                Assignees
              </div>
              <div className={isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'}>
                {assignmentError ? 
                  `Error: ${assignmentError}` : 
                  assignees.length > 0 ? 
                    assignees.map(a => getFullName(a)).join(', ') : 
                    'No assignees'}
              </div>
            </div>
            <div className={`${
              isPowerMode ? 'border-2 border-hot-pink' : 'border border-gray-200'
            } rounded-lg p-3`}>
              <div className={`text-sm font-semibold ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'}`}>
                Organization
              </div>
              <div className={isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'}>
                {organization ? organization.name : 'No organization'}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className={`flex-1 ${
            isPowerMode ? 'bg-electric-purple rounded-lg p-4' : 'bg-gray-50 rounded-lg p-4'
          }`}>
            <div className={`text-sm font-semibold mb-2 ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'}`}>
              Description
            </div>
            <div className={`h-full ${
              isPowerMode ? 'border-2 border-hot-pink text-toxic-yellow' : 'border border-gray-200 text-gray-900'
            } rounded-lg p-4 whitespace-pre-wrap overflow-auto`}>
              {ticket.description || 'No description'}
            </div>
          </div>

          {/* Custom Fields Section */}
          {ticket.custom_fields && (
            <div className={`${
              isPowerMode ? 'bg-electric-purple rounded-lg p-4' : 'bg-gray-50 rounded-lg p-4'
            }`}>
              <div className={`text-sm font-semibold mb-2 ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'}`}>
                Custom Fields
              </div>
              <div className={`${
                isPowerMode ? 'border-2 border-hot-pink text-toxic-yellow' : 'border border-gray-200 text-gray-900'
              } rounded-lg p-4 whitespace-pre-wrap`}>
                {JSON.stringify(ticket.custom_fields, null, 2)}
              </div>
            </div>
          )}
        </div>
      </PageContainer>

      <TicketActivitySidebar
        isOpen={isActivitySidebarOpen}
        onClose={() => setIsActivitySidebarOpen(false)}
        ticketId={ticket.id}
      />

      <ConversationSidebar
        isOpen={isConversationSidebarOpen}
        onClose={() => setIsConversationSidebarOpen(false)}
        ticketId={ticket.id}
      />

      {ticket && (
        <EditTicketPopout
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onTicketUpdated={async () => {
            // Refetch ticket data
            const { data: ticketData, error: ticketError } = await supabase
              .from('tickets')
              .select('*')
              .eq('id', id)
              .single()

            if (ticketError) {
              console.error('Error fetching ticket:', ticketError)
            } else {
              setTicket(ticketData)
              setOrganization(ticketData.organizations)

              // Fetch creator info
              const { data: creatorData } = await supabase
                .from('profiles')
                .select('user_id, first_name, last_name')
                .eq('user_id', ticketData.creator_id)
                .single()

              if (creatorData) {
                setCreator(creatorData)
              }

              // Fetch assignees
              const { data: assigneeData, error: assigneeError } = await supabase
                .rpc('get_ticket_assignees', { ticket_ids: [id] })

              if (assigneeError) {
                setAssignmentError(assigneeError.message)
                setAssignees([])
              } else if (assigneeData) {
                const profileInfos = assigneeData.map((assignee: AssigneeData) => ({
                  user_id: assignee.assignee_id,
                  first_name: assignee.first_name,
                  last_name: assignee.last_name
                }))
                setAssignees(profileInfos)
                setAssignmentError(null)
              } else {
                setAssignees([])
                setAssignmentError(null)
              }
            }
          }}
          ticket={ticket}
          currentAssignees={assignees}
        />
      )}
    </>
  )
} 