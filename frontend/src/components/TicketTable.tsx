import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { Tables } from '../types/database.types'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface TicketTableProps {
  tickets: Tables<'tickets'>[]
}

export function TicketTable({ tickets }: TicketTableProps) {
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [priorities, setPriorities] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchOptions() {
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
    }

    fetchOptions()
  }, [])

  const handleTicketClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`)
  }

  return (
    <div className={`overflow-x-auto ${
      isPowerMode ? 'font-comic' : ''
    }`}>
      <table className={`min-w-full table-auto ${
        isPowerMode ? 
        'border-4 border-hot-pink bg-electric-purple text-toxic-yellow' : 
        'border border-gray-200'
      }`}>
        <thead className={`${
          isPowerMode ? 
          'bg-hot-pink text-toxic-yellow font-impact text-xl animate-pulse' : 
          'bg-gray-50 text-gray-700'
        }`}>
          <tr>
            <th className="px-6 py-3 text-left">Title</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">Priority</th>
            <th className="px-6 py-3 text-left">Created</th>
            <th className="px-6 py-3 text-left">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td 
                colSpan={5} 
                className={`px-6 py-8 text-center ${
                  isPowerMode ? 
                  'text-toxic-yellow font-comic animate-pulse' : 
                  'text-gray-500'
                }`}
              >
                {isPowerMode ? '🎪 No tickets yet! Time to create some! 🎭' : 'No tickets found'}
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr 
                key={ticket.id}
                onClick={() => handleTicketClick(ticket.id)}
                className={`cursor-pointer transition-all ${
                  isPowerMode ?
                  'hover:bg-neon-green hover:text-eye-burn-orange hover:scale-105 hover:-rotate-1' :
                  'hover:bg-gray-50'
                }`}
              >
                <td className="px-6 py-4 border-b">{ticket.title}</td>
                <td className="px-6 py-4 border-b">{statuses[ticket.status_id] || 'Loading...'}</td>
                <td className="px-6 py-4 border-b">{priorities[ticket.priority_id] || 'Loading...'}</td>
                <td className="px-6 py-4 border-b">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 border-b">
                  {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
} 