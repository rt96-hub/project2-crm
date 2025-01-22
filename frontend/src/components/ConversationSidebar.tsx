import { useTheme } from '../context/ThemeContext'
import { useState, useEffect } from 'react'

interface ConversationSidebarProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
}

export function ConversationSidebar({ isOpen, onClose, ticketId }: ConversationSidebarProps) {
  const { isPowerMode } = useTheme()
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && ticketId) {
      // TODO: Fetch messages for the ticket
      setMessages([])
    }
  }, [isOpen, ticketId])

  if (!isOpen) return null

  return (
    <div className={`fixed right-0 top-0 h-screen w-96 shadow-lg flex flex-col ${
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

      {/* Conversation List */}
      <div className="flex-grow overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className={`text-center ${
            isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
          }`}>
            No messages yet
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`mb-4 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              {/* TODO: Format message content */}
              {JSON.stringify(message)}
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
            className={`px-4 py-2 rounded ${
              isPowerMode ?
              'bg-hot-pink text-toxic-yellow hover:bg-pink-600' :
              'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
} 