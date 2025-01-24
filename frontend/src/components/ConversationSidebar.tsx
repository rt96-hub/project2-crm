import { useTheme } from '../context/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/database.types'
import { useUser } from '../context/UserContext'

interface ConversationSidebarProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
}

type ProfileInfo = {
  user_id: string
  first_name: string | null
  last_name: string | null
}

export function ConversationSidebar({ isOpen, onClose, ticketId }: ConversationSidebarProps) {
  const { isPowerMode } = useTheme()
  const { profile } = useUser()
  const [messages, setMessages] = useState<(Tables<'ticket_conversations'> & { profile: ProfileInfo })[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messageContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchMessages()
    }
  }, [isOpen, ticketId])

  useEffect(() => {
    if (messageContainerRef.current && !loading && messages.length > 0) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
    }
  }, [loading, messages])

  const fetchMessages = async () => {
    setLoading(true)

    const { data: conversationData, error } = await supabase
      .from('ticket_conversations')
      .select(`
        *,
        profile:profiles (
          user_id,
          first_name,
          last_name
        )
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (!error && conversationData) {
      setMessages(conversationData.map(msg => ({
        ...msg,
        profile: msg.profile as ProfileInfo
      })))
    }

    setLoading(false)
  }

  const handleSubmitMessage = async () => {
    if (!newMessage.trim() || !profile) return

    const { error } = await supabase
      .from('ticket_conversations')
      .insert({
        ticket_id: ticketId,
        profile_id: profile.user_id,
        text: newMessage
      })

    if (!error) {
      setNewMessage('')
      fetchMessages()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitMessage()
    }
  }

  const getFullName = (profile: ProfileInfo) => {
    return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown'
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
          Conversation
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

      {/* Message List */}
      <div ref={messageContainerRef} className="flex-grow overflow-y-auto p-4">
        {loading ? (
          <div className={`text-center ${
            isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
          }`}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className={`text-center ${
            isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
          }`}>
            No messages yet
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`mb-4 p-3 rounded-lg ${
              message.profile_id === profile?.user_id ?
              (isPowerMode ? 'bg-hot-pink bg-opacity-20 ml-8' : 'bg-blue-50 ml-8') :
              (isPowerMode ? 'bg-electric-purple bg-opacity-20 mr-8' : 'bg-gray-50 mr-8')
            }`}>
              <div className={`font-semibold mb-1 ${
                isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'
              }`}>
                {getFullName(message.profile)}
              </div>
              <div className={`whitespace-pre-wrap ${
                isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
              }`}>
                {message.text}
              </div>
              <div className={`text-sm mt-1 ${
                isPowerMode ? 'text-hot-pink' : 'text-gray-500'
              }`}>
                {new Date(message.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Entry Area */}
      <div className={`p-4 ${
        isPowerMode ? 'border-t-2 border-hot-pink' : 'border-t border-gray-200'
      }`}>
        <textarea
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
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
            onClick={handleSubmitMessage}
            disabled={!newMessage.trim()}
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