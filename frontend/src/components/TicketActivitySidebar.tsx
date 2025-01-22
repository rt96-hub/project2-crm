import { useTheme } from '../context/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/database.types'
import { useUser } from '../context/UserContext'

interface TicketActivitySidebarProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
}

type ActivityItem = {
  id: string
  type: 'history' | 'comment'
  actor_id: string
  created_at: string
  content?: string
  action?: string
  changes?: any
}

type ProfileInfo = {
  user_id: string
  first_name: string | null
  last_name: string | null
}

export function TicketActivitySidebar({ isOpen, onClose, ticketId }: TicketActivitySidebarProps) {
  const { isPowerMode } = useTheme()
  const { profile } = useUser()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({})
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [priorities, setPriorities] = useState<Record<string, string>>({})
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const activityContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchActivities()
    }
  }, [isOpen, ticketId])

  useEffect(() => {
    if (activityContainerRef.current && !loading && activities.length > 0) {
      activityContainerRef.current.scrollTop = activityContainerRef.current.scrollHeight
    }
  }, [loading, activities])

  const fetchActivities = async () => {
    setLoading(true)

    // Fetch ticket history
    const { data: historyData } = await supabase
      .from('ticket_history')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })

    // Fetch comments
    const { data: commentData } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })

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

    // Combine and sort activities
    const allActivities: ActivityItem[] = [
      ...(historyData || []).map((h: Tables<'ticket_history'>) => ({
        ...h,
        type: 'history' as const
      })),
      ...(commentData || []).map((c: Tables<'ticket_comments'>) => ({
        id: c.id,
        type: 'comment' as const,
        actor_id: c.author_id,
        created_at: c.created_at,
        content: c.content
      }))
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // Fetch profiles for all actors
    const actorIds = [...new Set(allActivities.map(a => a.actor_id))]
    if (actorIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', actorIds)

      if (profileData) {
        const profileMap = profileData.reduce((acc, profile) => ({
          ...acc,
          [profile.user_id]: profile
        }), {} as Record<string, ProfileInfo>)
        setProfiles(profileMap)
      }
    }

    setActivities(allActivities)
    setLoading(false)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !profile) return

    const { error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        content: newComment,
        is_internal: false,
        author_id: profile.user_id
      })

    if (!error) {
      setNewComment('')
      fetchActivities()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  const getFullName = (userId: string) => {
    const profile = profiles[userId]
    if (!profile) return 'Unknown'
    return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown'
  }

  const formatChange = (changes: any) => {
    const lines: string[] = []
    
    Object.entries(changes).forEach(([field, value]: [string, any]) => {
      switch (field) {
        case 'status_id':
          lines.push(`Changed status from ${statuses[value.from] || 'Unknown'} to ${statuses[value.to] || 'Unknown'}`)
          break
        case 'priority_id':
          lines.push(`Changed priority from ${priorities[value.from] || 'Unknown'} to ${priorities[value.to] || 'Unknown'}`)
          break
        case 'title':
          lines.push(`Changed title from "${value.from}" to "${value.to}"`)
          break
        case 'description':
          lines.push('Updated description')
          break
        case 'due_date':
          const fromDate = value.from ? new Date(value.from).toLocaleDateString() : 'none'
          const toDate = value.to ? new Date(value.to).toLocaleDateString() : 'none'
          lines.push(`Changed due date from ${fromDate} to ${toDate}`)
          break
        case 'assignees':
          if (value.removed?.length) {
            value.removed.forEach((id: string) => {
              lines.push(`Removed assignee ${getFullName(id)}`)
            })
          }
          if (value.added?.length) {
            value.added.forEach((id: string) => {
              lines.push(`Added assignee ${getFullName(id)}`)
            })
          }
          break
      }
    })

    return lines
  }

  if (!isOpen) return null

  return (
    <div className={`fixed right-0 top-0 bottom-0 w-96 shadow-lg flex flex-col ${
      isPowerMode ? 'bg-electric-purple' : 'bg-white border-l border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 flex justify-between items-center ${
        isPowerMode ? 'border-b-2 border-hot-pink' : 'border-b border-gray-200'
      }`}>
        <h2 className={`font-semibold ${
          isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'
        }`}>
          Activity
        </h2>
        <button
          onClick={onClose}
          className={`p-2 rounded hover:bg-opacity-80 ${
            isPowerMode ? 'text-toxic-yellow hover:bg-hot-pink' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          ✕
        </button>
      </div>

      {/* Activity List */}
      <div ref={activityContainerRef} className="flex-grow overflow-y-auto p-4">
        {loading ? (
          <div className={`text-center ${
            isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
          }`}>
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className={`text-center ${
            isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
          }`}>
            No activity yet
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className={`mb-4 p-3 rounded-lg ${
              isPowerMode ? 
              'bg-opacity-20 bg-hot-pink text-toxic-yellow' : 
              'bg-gray-50'
            }`}>
              <div className={`font-semibold mb-1 ${
                isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'
              }`}>
                {getFullName(activity.actor_id)}
              </div>
              {activity.type === 'comment' ? (
                <div className={`whitespace-pre-wrap ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'}`}>
                  {activity.content}
                </div>
              ) : (
                <div>
                  {formatChange(activity.changes!).map((line, i) => (
                    <div key={i} className={isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'}>
                      {line}
                    </div>
                  ))}
                </div>
              )}
              <div className={`text-sm mt-1 ${
                isPowerMode ? 'text-hot-pink' : 'text-gray-500'
              }`}>
                {new Date(activity.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Text Entry Area */}
      <div className={`p-4 ${
        isPowerMode ? 'border-t-2 border-hot-pink' : 'border-t border-gray-200'
      }`}>
        <textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full p-3 rounded-lg resize-none ${
            isPowerMode ?
            'bg-neon-green text-eye-burn-orange placeholder-hot-pink border-2 border-hot-pink' :
            'border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
          rows={3}
        />
        <div className="mt-2 flex justify-between items-center">
          <button
            className={`p-2 rounded ${
              isPowerMode ?
              'text-toxic-yellow hover:bg-hot-pink' :
              'text-gray-500 hover:bg-gray-100'
            }`}
            title="Attach file"
          >
            📎
          </button>
          <button
            className={`px-4 py-2 rounded ${
              isPowerMode ?
              'bg-hot-pink text-toxic-yellow hover:bg-pink-600' :
              'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isPowerMode ? '😠MadAI🤖' : 'MadAI'}
          </button>
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            className={`px-4 py-2 rounded ${
              isPowerMode ?
              'bg-hot-pink text-toxic-yellow hover:bg-pink-600 disabled:opacity-50' :
              'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
} 