import { useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { PageContainer } from '../components/PageContainer'
import { Tables } from '../types/database.types'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type ProfileInfo = {
  user_id: string
  first_name: string | null
  last_name: string | null
}

export function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const { isPowerMode } = useTheme()
  const [ticket, setTicket] = useState<Tables<'tickets'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [priorities, setPriorities] = useState<Record<string, string>>({})
  const [creator, setCreator] = useState<ProfileInfo | null>(null)
  const [assignees, setAssignees] = useState<ProfileInfo[]>([])
  const [assignmentError, setAssignmentError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!id) return

      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

      if (ticketError) {
        console.error('Error fetching ticket:', ticketError)
      } else {
        setTicket(ticketData)

        // Fetch creator info
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .eq('user_id', ticketData.creator_id)
          .single()

        if (creatorData) {
          setCreator(creatorData)
        }

        // Fetch assignees with debug info
        console.log('Fetching assignees for ticket:', id)
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('ticket_assignments')
          .select('ticket_id, profile_id')
          .eq('ticket_id', id)

        console.log('Assignment data:', assignmentData)
        console.log('Assignment error:', assignmentError)

        if (assignmentError) {
          setAssignmentError(assignmentError.message)
        } else if (assignmentData && assignmentData.length > 0) {
          // Get unique profile IDs
          const profileIds = [...new Set(assignmentData.map(a => a.profile_id))]
          
          // Fetch profiles for these IDs
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', profileIds)

          if (profileError) {
            setAssignmentError(profileError.message)
          } else if (profileData) {
            setAssignees(profileData)
          }
        } else {
          setAssignees([])
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

  if (loading) {
    return (
      <PageContainer title="Loading Ticket...">
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
      <PageContainer title="Ticket Not Found">
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

  const fields = [
    { label: 'Title', value: ticket.title },
    { label: 'Description', value: ticket.description || 'No description' },
    { label: 'Status', value: statuses[ticket.status_id] || 'Loading...' },
    { label: 'Priority', value: priorities[ticket.priority_id] || 'Loading...' },
    { label: 'Created', value: new Date(ticket.created_at).toLocaleString() },
    { label: 'Updated', value: new Date(ticket.updated_at).toLocaleString() },
    { label: 'Due Date', value: ticket.due_date ? new Date(ticket.due_date).toLocaleString() : 'No due date' },
    { label: 'Creator', value: creator ? getFullName(creator) : 'Loading...' },
    { 
      label: 'Assignees', 
      value: assignmentError ? 
        `Error loading assignees: ${assignmentError}` : 
        assignees.length > 0 ? 
          assignees.map(a => getFullName(a)).join(', ') : 
          'No assignees'
    },
    { label: 'Organization', value: ticket.organization_id || 'No organization' },
    { label: 'Custom Fields', value: ticket.custom_fields ? JSON.stringify(ticket.custom_fields, null, 2) : 'No custom fields' },
    { label: 'Debug Info', value: `
      Assignee Count: ${assignees.length}
      Assignment Error: ${assignmentError || 'None'}
      Creator ID: ${ticket.creator_id}
      Creator Profile: ${creator ? JSON.stringify(creator, null, 2) : 'Not loaded'}
    ` }
  ]

  return (
    <PageContainer title={`Ticket: ${ticket.title}`}>
      <div className={`space-y-6 ${
        isPowerMode ? 'font-comic' : ''
      }`}>
        {fields.map(({ label, value }) => (
          <div 
            key={label}
            className={`${
              isPowerMode ? 
              'bg-electric-purple p-4 rounded-lg border-2 border-hot-pink transform hover:rotate-1 hover:scale-105 transition-all' :
              'border-b border-gray-200 pb-4'
            }`}
          >
            <div className={`font-bold mb-1 ${
              isPowerMode ? 
              'text-toxic-yellow text-xl font-impact animate-pulse' :
              'text-gray-600'
            }`}>
              {label}
            </div>
            <div className={
              isPowerMode ? 
              'text-toxic-yellow whitespace-pre-wrap' :
              'text-gray-900 whitespace-pre-wrap'
            }>
              {value}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
} 