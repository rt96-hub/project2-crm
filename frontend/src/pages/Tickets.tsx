import { useEffect, useState } from 'react'
import { PageContainer } from '../components/PageContainer'
import { TicketTable } from '../components/TicketTable'
import { CreateTicketPopout } from '../components/CreateTicketPopout'
import { Tables } from '../types/database.types'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'

export function Tickets() {
  const [tickets, setTickets] = useState<Tables<'tickets'>[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { isPowerMode } = useTheme()

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tickets:', error)
    } else {
      setTickets(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  if (loading) {
    return (
      <PageContainer title="Tickets">
        <div className={`animate-pulse ${
          isPowerMode ? 'text-toxic-yellow' : 'text-gray-600'
        }`}>
          Loading tickets...
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Tickets">
      <div className="mb-6">
        <button
          onClick={() => setIsCreateOpen(true)}
          className={`px-4 py-2 rounded ${
            isPowerMode ?
            'bg-hot-pink text-toxic-yellow hover:bg-pink-600 font-comic transform hover:scale-105 hover:rotate-2 transition-all' :
            'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isPowerMode ? '🎪 Create Magical Ticket ✨' : 'Create Ticket'}
        </button>
      </div>

      <TicketTable tickets={tickets} />

      <CreateTicketPopout
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTicketCreated={fetchTickets}
      />
    </PageContainer>
  )
} 