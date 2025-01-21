import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { TablesInsert, Tables } from '../types/database.types'
import { createPortal } from 'react-dom'

interface CreateTicketPopoutProps {
  isOpen: boolean
  onClose: () => void
  onTicketCreated: () => void
}

export function CreateTicketPopout({ isOpen, onClose, onTicketCreated }: CreateTicketPopoutProps) {
  const { isPowerMode } = useTheme()
  const { profile } = useUser()
  const [formData, setFormData] = useState<{
    title: string
    description: string
    status_id: string
    priority_id: string
    due_date: string
    assigned_to_id: string
  }>({
    title: '',
    description: '',
    status_id: '',
    priority_id: '',
    due_date: '',
    assigned_to_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Tables<'statuses'>[]>([])
  const [priorities, setPriorities] = useState<Tables<'priorities'>[]>([])
  const [profiles, setProfiles] = useState<Tables<'profiles'>[]>([])

  useEffect(() => {
    async function fetchOptions() {
      // Fetch statuses
      const { data: statusData } = await supabase
        .from('statuses')
        .select('*')
        .order('name')

      if (statusData) {
        setStatuses(statusData)
      }

      // Fetch priorities
      const { data: priorityData } = await supabase
        .from('priorities')
        .select('*')
        .order('name')

      if (priorityData) {
        setPriorities(priorityData)
      }

      // Fetch active profiles
      const { data: profileData } = await supabase
        .rpc('get_all_active_profiles')

      if (profileData) {
        setProfiles(profileData)
      }
    }

    if (isOpen) {
      fetchOptions()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    setError(null)

    const ticketData: TablesInsert<'tickets'> = {
      title: formData.title,
      description: formData.description,
      status_id: formData.status_id,
      priority_id: formData.priority_id,
      due_date: formData.due_date || null,
      creator_id: profile.user_id,
    }

    // Create ticket
    const { data: ticketResult, error: createError } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single()

    if (createError) {
      setLoading(false)
      setError(createError.message)
      return
    }

    // Create ticket assignment
    const assignmentData: TablesInsert<'ticket_assignments'> = {
      ticket_id: ticketResult.id,
      profile_id: formData.assigned_to_id || profile.user_id, // Default to creator if no assignment
      assignment_type: 'standard' // should probably be another table and this becomes a dropdown with the fk relationship
    }

    const { error: assignmentError } = await supabase
      .from('ticket_assignments')
      .insert(assignmentData)

    setLoading(false)

    if (assignmentError) {
      setError(assignmentError.message)
    } else {
      onTicketCreated()
      onClose()
      setFormData({
        title: '',
        description: '',
        status_id: '',
        priority_id: '',
        due_date: '',
        assigned_to_id: '',
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`w-[600px] rounded-lg shadow-lg p-6 ${
        isPowerMode ? 
        'bg-electric-purple border-4 border-hot-pink animate-wiggle' : 
        'bg-white'
      }`}>
        <h2 className={`text-2xl font-bold mb-4 ${
          isPowerMode ? 
          'text-toxic-yellow font-impact animate-pulse' : 
          'text-gray-900'
        }`}>
          {isPowerMode ? '✨ Create Magical Ticket ✨' : 'Create New Ticket'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange placeholder-hot-pink font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
              placeholder="Enter ticket title"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange placeholder-hot-pink font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
              placeholder="Enter ticket description"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Status
            </label>
            <select
              name="status_id"
              value={formData.status_id}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
            >
              <option value="">Select status</option>
              {statuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Priority
            </label>
            <select
              name="priority_id"
              value={formData.priority_id}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
            >
              <option value="">Select priority</option>
              {priorities.map(priority => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Due Date
            </label>
            <input
              type="datetime-local"
              name="due_date"
              value={formData.due_date ?? ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Assign To
            </label>
            <select
              name="assigned_to_id"
              value={formData.assigned_to_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
            >
              <option value="">Assign to me</option>
              {profiles.map(user => (
                <option key={user.user_id} value={user.user_id}>
                  {user.first_name} {user.last_name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className={`text-red-500 ${
              isPowerMode ? 'font-comic animate-bounce' : ''
            }`}>
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded ${
                isPowerMode ?
                'bg-gray-600 text-toxic-yellow hover:bg-gray-500 font-comic' :
                'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded ${
                isPowerMode ?
                'bg-hot-pink text-toxic-yellow hover:bg-pink-600 font-comic disabled:opacity-50 disabled:hover:bg-hot-pink' :
                'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600'
              }`}
            >
              {loading ? 
                (isPowerMode ? '🎭 Conjuring... 🎪' : 'Creating...') : 
                (isPowerMode ? '✨ Create Magic! ✨' : 'Create Ticket')
              }
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
} 