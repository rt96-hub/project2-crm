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
    organization_id: string
  }>({
    title: '',
    description: '',
    status_id: '',
    priority_id: '',
    due_date: '',
    organization_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Tables<'statuses'>[]>([])
  const [priorities, setPriorities] = useState<Tables<'priorities'>[]>([])
  const [profiles, setProfiles] = useState<Tables<'profiles'>[]>([])
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<{
    user_id: string
    first_name: string | null
    last_name: string | null
  }[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Tables<'profiles'>[]>([])
  const [organizations, setOrganizations] = useState<Tables<'organizations'>[]>([])
  const [orgSearch, setOrgSearch] = useState('')
  const [filteredOrgs, setFilteredOrgs] = useState<Tables<'organizations'>[]>([])

  useEffect(() => {
    async function fetchOptions() {
      // Fetch statuses
      const { data: statusData } = await supabase
        .from('statuses')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (statusData) {
        setStatuses(statusData)
      }

      // Fetch priorities
      const { data: priorityData } = await supabase
        .from('priorities')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (priorityData) {
        setPriorities(priorityData)
      }

      // Fetch active profiles
      const { data: profileData } = await supabase
        .rpc('get_all_active_employee_profiles')

      if (profileData) {
        setProfiles(profileData)
      }

      // Fetch organizations
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .order('name')
        .eq('is_active', true)

      if (orgData) {
        setOrganizations(orgData)
      }
    }

    if (isOpen) {
      fetchOptions()
    }
  }, [isOpen])

  useEffect(() => {
    // Filter profiles based on search
    if (assigneeSearch.trim()) {
      const searchLower = assigneeSearch.toLowerCase()
      const filtered = profiles.filter(profile => {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase()
        const email = profile.email.toLowerCase()
        return fullName.includes(searchLower) || email.includes(searchLower)
      })
      setFilteredProfiles(filtered)
    } else {
      setFilteredProfiles([])
    }
  }, [assigneeSearch, profiles])

  useEffect(() => {
    // Filter organizations based on search
    if (orgSearch.trim()) {
      const searchLower = orgSearch.toLowerCase()
      const filtered = organizations.filter(org => 
        org.name.toLowerCase().includes(searchLower)
      )
      setFilteredOrgs(filtered)
    } else {
      setFilteredOrgs([])
    }
  }, [orgSearch, organizations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    // Validate that either organization or assignee is selected
    if (!formData.organization_id && selectedAssignees.length === 0) {
      setError('Please select either an organization or at least one assignee')
      return
    }

    setLoading(true)
    setError(null)

    const ticketData: TablesInsert<'tickets'> = {
      title: formData.title,
      description: formData.description,
      status_id: formData.status_id,
      priority_id: formData.priority_id,
      due_date: formData.due_date || null,
      creator_id: profile.user_id,
      organization_id: formData.organization_id || null,
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

    // Create ticket assignments
    const assigneesToAdd = selectedAssignees.length > 0 ? selectedAssignees : [{
      user_id: profile.user_id,
      first_name: profile.first_name,
      last_name: profile.last_name
    }]

    const assignmentData: TablesInsert<'ticket_assignments'>[] = assigneesToAdd.map(assignee => ({
      ticket_id: ticketResult.id,
      profile_id: assignee.user_id,
      assignment_type: 'standard'
    }))

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
        organization_id: '',
      })
      setSelectedAssignees([])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAssigneeRemove = (userId: string) => {
    setSelectedAssignees(prev => prev.filter(a => a.user_id !== userId))
  }

  const handleAssigneeAdd = (profile: Tables<'profiles'>) => {
    if (!selectedAssignees.some(a => a.user_id === profile.user_id)) {
      setSelectedAssignees(prev => [...prev, {
        user_id: profile.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name
      }])
    }
    setAssigneeSearch('')
  }

  // Prevent enter key from submitting the form
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`w-[500px] rounded-lg shadow-lg p-4 ${
        isPowerMode ? 
        'bg-electric-purple border-4 border-hot-pink animate-wiggle' : 
        'bg-white'
      }`}>
        <h2 className={`text-xl font-bold mb-3 ${
          isPowerMode ? 
          'text-toxic-yellow font-impact animate-pulse' : 
          'text-gray-900'
        }`}>
          {isPowerMode ? '✨ Create Magical Ticket ✨' : 'Create New Ticket'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3" onKeyDown={handleKeyDown}>
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

          {/* Status, Priority, Due Date Row */}
          <div className="grid grid-cols-3 gap-4">
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
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Organization
            </label>
            <div className="relative">
              <input
                type="text"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="Search for organization..."
                className={`w-full px-3 py-2 rounded ${
                  isPowerMode ?
                  'bg-neon-green text-eye-burn-orange placeholder-hot-pink font-comic border-2 border-hot-pink' :
                  'border border-gray-300'
                } ${!formData.organization_id && selectedAssignees.length === 0 ? 'border-red-500' : ''}`}
              />
              
              {/* Organization search results dropdown */}
              {filteredOrgs.length > 0 && (
                <div className={`absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md shadow-lg ${
                  isPowerMode ? 'bg-electric-purple border-2 border-hot-pink' : 'bg-white border border-gray-300'
                }`}>
                  {filteredOrgs.map(org => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, organization_id: org.id }))
                        setOrgSearch(org.name)
                        setFilteredOrgs([])
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-opacity-80 ${
                        isPowerMode ?
                        'text-toxic-yellow hover:bg-hot-pink' :
                        'hover:bg-gray-100'
                      }`}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Assignees
            </label>
            <div className="space-y-2">
              {/* Selected assignees */}
              <div className="flex flex-wrap gap-2">
                {selectedAssignees.map(assignee => (
                  <div
                    key={assignee.user_id}
                    className={`flex items-center gap-1 px-2 py-1 rounded ${
                      isPowerMode ?
                      'bg-hot-pink text-toxic-yellow' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <span>
                      {[assignee.first_name, assignee.last_name].filter(Boolean).join(' ') || 'Unknown'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAssigneeRemove(assignee.user_id)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Assignee search */}
              <div className="relative">
                <input
                  type="text"
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  placeholder="Search for assignees..."
                  className={`w-full px-3 py-2 rounded ${
                    isPowerMode ?
                    'bg-neon-green text-eye-burn-orange placeholder-hot-pink font-comic border-2 border-hot-pink' :
                    'border border-gray-300'
                  } ${!formData.organization_id && selectedAssignees.length === 0 ? 'border-red-500' : ''}`}
                />
                
                {/* Dropdown for search results */}
                {filteredProfiles.length > 0 && (
                  <div className={`absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md shadow-lg ${
                    isPowerMode ? 'bg-electric-purple border-2 border-hot-pink' : 'bg-white border border-gray-300'
                  }`}>
                    {filteredProfiles.map(profile => (
                      <button
                        key={profile.user_id}
                        type="button"
                        onClick={() => handleAssigneeAdd(profile)}
                        className={`w-full text-left px-4 py-2 hover:bg-opacity-80 ${
                          isPowerMode ?
                          'text-toxic-yellow hover:bg-hot-pink' :
                          'hover:bg-gray-100'
                        }`}
                      >
                        {[profile.first_name, profile.last_name].filter(Boolean).join(' ')} ({profile.email})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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