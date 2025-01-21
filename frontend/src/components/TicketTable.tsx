import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { Tables } from '../types/database.types'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

interface TicketTableProps {
  tickets: Tables<'tickets'>[]
}

type SortableColumns = 'title' | 'status_id' | 'priority_id' | 'created_at' | 'due_date'

type SortConfig = {
  key: SortableColumns | ''
  direction: 'asc' | 'desc'
}

type Filters = {
  title: string
  status_id: string[]
  priority_id: string[]
  created_at: string
  due_date: string
}

export function TicketTable({ tickets }: TicketTableProps) {
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [priorities, setPriorities] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' })
  const [openDropdown, setOpenDropdown] = useState<'status' | 'priority' | null>(null)
  const [filters, setFilters] = useState<Filters>({
    title: '',
    status_id: [],
    priority_id: [],
    created_at: '',
    due_date: ''
  })

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

  // Add click outside handler to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest('.filter-dropdown')) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSort = (key: SortableColumns) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        if (prevConfig.direction === 'asc') {
          return { key, direction: 'desc' }
        } else {
          return { key: '', direction: 'asc' } // Reset to no sort
        }
      }
      return { key, direction: 'asc' } // First click on new column
    })
  }

  const handleFilterChange = (key: keyof Filters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleMultiSelectChange = (key: 'status_id' | 'priority_id', value: string) => {
    setFilters(prev => {
      const currentValues = prev[key]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      return { ...prev, [key]: newValues }
    })
  }

  const filteredAndSortedTickets = useMemo(() => {
    let result = [...tickets]

    // Apply filters
    result = result.filter(ticket => {
      const matchesTitle = ticket.title.toLowerCase().includes(filters.title.toLowerCase())
      const matchesStatus = filters.status_id.length === 0 || filters.status_id.includes(ticket.status_id)
      const matchesPriority = filters.priority_id.length === 0 || filters.priority_id.includes(ticket.priority_id)
      const matchesCreatedAt = !filters.created_at || ticket.created_at.includes(filters.created_at)
      const matchesDueDate = !filters.due_date || (ticket.due_date && ticket.due_date.includes(filters.due_date))

      return matchesTitle && matchesStatus && matchesPriority && matchesCreatedAt && matchesDueDate
    })

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (!sortConfig.key) return 0
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue === null) return 1
        if (bValue === null) return -1
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [tickets, filters, sortConfig])

  const handleTicketClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`)
  }

  const getSortIndicator = (key: SortableColumns) => {
    if (sortConfig.key !== key) return '↕'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  return (
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
            <th className="px-6 py-2">
              <input
                type="text"
                placeholder="Filter title..."
                value={filters.title}
                onChange={(e) => handleFilterChange('title', e.target.value)}
                className={`w-full p-1 ${
                  isPowerMode ? 'bg-electric-purple text-toxic-yellow' : 'bg-white'
                }`}
              />
            </th>
            <th className="px-6 py-2">
              <div className="relative filter-dropdown">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                  className={`w-full p-2 text-left flex justify-between items-center ${
                    isPowerMode ? 'bg-electric-purple text-toxic-yellow' : 'bg-white border border-gray-300'
                  }`}
                >
                  <span>
                    {filters.status_id.length 
                      ? `${filters.status_id.length} selected` 
                      : 'Filter status...'}
                  </span>
                  <span>{openDropdown === 'status' ? '▲' : '▼'}</span>
                </button>
                {openDropdown === 'status' && (
                  <div className={`absolute z-50 w-full mt-1 shadow-lg rounded-md ${
                    isPowerMode ? 'bg-electric-purple text-toxic-yellow' : 'bg-white border border-gray-300'
                  }`}>
                    <div className="p-2 max-h-48 overflow-y-auto">
                      {Object.entries(statuses).map(([id, name]) => (
                        <label key={id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded">
                          <input
                            type="checkbox"
                            checked={filters.status_id.includes(id)}
                            onChange={() => handleMultiSelectChange('status_id', id)}
                            className="rounded"
                          />
                          <span>{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </th>
            <th className="px-6 py-2">
              <div className="relative filter-dropdown">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
                  className={`w-full p-2 text-left flex justify-between items-center ${
                    isPowerMode ? 'bg-electric-purple text-toxic-yellow' : 'bg-white border border-gray-300'
                  }`}
                >
                  <span>
                    {filters.priority_id.length 
                      ? `${filters.priority_id.length} selected` 
                      : 'Filter priority...'}
                  </span>
                  <span>{openDropdown === 'priority' ? '▲' : '▼'}</span>
                </button>
                {openDropdown === 'priority' && (
                  <div className={`absolute z-50 w-full mt-1 shadow-lg rounded-md ${
                    isPowerMode ? 'bg-electric-purple text-toxic-yellow' : 'bg-white border border-gray-300'
                  }`}>
                    <div className="p-2 max-h-48 overflow-y-auto">
                      {Object.entries(priorities).map(([id, name]) => (
                        <label key={id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded">
                          <input
                            type="checkbox"
                            checked={filters.priority_id.includes(id)}
                            onChange={() => handleMultiSelectChange('priority_id', id)}
                            className="rounded"
                          />
                          <span>{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </th>
            <th className="px-6 py-2">
              <input
                type="date"
                value={filters.created_at}
                onChange={(e) => handleFilterChange('created_at', e.target.value)}
                className={`w-full p-1 ${
                  isPowerMode ? 'bg-electric-purple text-toxic-yellow' : 'bg-white'
                }`}
              />
            </th>
            <th className="px-6 py-2">
              <input
                type="date"
                value={filters.due_date}
                onChange={(e) => handleFilterChange('due_date', e.target.value)}
                className={`w-full p-1 ${
                  isPowerMode ? 'bg-electric-purple text-toxic-yellow' : 'bg-white'
                }`}
              />
            </th>
          </tr>
          <tr className={`${
            isPowerMode ? 
            'bg-hot-pink text-toxic-yellow font-impact text-xl animate-pulse' : 
            'bg-gray-50 text-gray-700'
          }`}>
            <th 
              className="px-6 py-3 text-left cursor-pointer"
              onClick={() => handleSort('title')}
            >
              Title {getSortIndicator('title')}
            </th>
            <th 
              className="px-6 py-3 text-left cursor-pointer"
              onClick={() => handleSort('status_id')}
            >
              Status {getSortIndicator('status_id')}
            </th>
            <th 
              className="px-6 py-3 text-left cursor-pointer"
              onClick={() => handleSort('priority_id')}
            >
              Priority {getSortIndicator('priority_id')}
            </th>
            <th 
              className="px-6 py-3 text-left cursor-pointer"
              onClick={() => handleSort('created_at')}
            >
              Created {getSortIndicator('created_at')}
            </th>
            <th 
              className="px-6 py-3 text-left cursor-pointer"
              onClick={() => handleSort('due_date')}
            >
              Due Date {getSortIndicator('due_date')}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedTickets.length === 0 ? (
            <tr>
              <td 
                colSpan={5} 
                className={`px-6 py-8 text-center ${
                  isPowerMode ? 
                  'text-toxic-yellow font-comic animate-pulse' : 
                  'text-gray-500'
                }`}
              >
                {isPowerMode ? '🎪 No tickets match your filters! 🎭' : 'No matching tickets found'}
              </td>
            </tr>
          ) : (
            filteredAndSortedTickets.map((ticket) => (
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