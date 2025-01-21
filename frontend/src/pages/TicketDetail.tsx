import { useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { PageContainer } from '../components/PageContainer'
import { Tables } from '../types/database.types'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const { isPowerMode } = useTheme()
  const [ticket, setTicket] = useState<Tables<'tickets'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [priorities, setPriorities] = useState<Record<string, string>>({})

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

  const fields = [
    { label: 'Title', value: ticket.title },
    { label: 'Description', value: ticket.description || 'No description' },
    { label: 'Status', value: statuses[ticket.status_id] || 'Loading...' },
    { label: 'Priority', value: priorities[ticket.priority_id] || 'Loading...' },
    { label: 'Created', value: new Date(ticket.created_at).toLocaleString() },
    { label: 'Updated', value: new Date(ticket.updated_at).toLocaleString() },
    { label: 'Due Date', value: ticket.due_date ? new Date(ticket.due_date).toLocaleString() : 'No due date' },
    { label: 'Creator', value: ticket.creator_id },
    { label: 'Organization', value: ticket.organization_id || 'No organization' },
    { label: 'Custom Fields', value: ticket.custom_fields ? JSON.stringify(ticket.custom_fields, null, 2) : 'No custom fields' },
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