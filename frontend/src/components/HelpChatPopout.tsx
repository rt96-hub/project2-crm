import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { Tables, TablesInsert } from '../types/database.types';

interface HelpChatPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId?: string;
}

type ProfileInfo = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

export function HelpChatPopout({ isOpen, onClose, ticketId }: HelpChatPopoutProps) {
  const { isPowerMode } = useTheme();
  const { profile } = useUser();
  const [messages, setMessages] = useState<(Tables<'ticket_conversations'> & { profile: ProfileInfo })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userTickets, setUserTickets] = useState<Tables<'tickets'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(ticketId || null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);

  // Update selectedTicketId when ticketId prop changes
  useEffect(() => {
    if (ticketId) {
      setSelectedTicketId(ticketId);
    }
  }, [ticketId]);

  // Fetch user's tickets
  useEffect(() => {
    if (!profile || !isOpen) return;

    const fetchUserTickets = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('creator_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
      } else {
        setUserTickets(data || []);
      }
    };

    fetchUserTickets();
  }, [profile, isOpen]);

  // Fetch messages when a ticket is selected
  useEffect(() => {
    if (selectedTicketId) {
      fetchMessages(selectedTicketId);
    } else {
      setMessages([]);
    }
  }, [selectedTicketId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageContainerRef.current && !loading && messages.length > 0) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [loading, messages]);

  const fetchMessages = async (ticketId: string) => {
    setLoading(true);

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
      .order('created_at', { ascending: true });

    if (!error && conversationData) {
      setMessages(conversationData.map(msg => ({
        ...msg,
        profile: msg.profile as ProfileInfo
      })));
    }

    setLoading(false);
  };

  const getFullName = (profile: ProfileInfo | null) => {
    if (!profile) return 'MadAI';
    return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown';
  };

  const createNewTicket = async (message: string) => {
    if (!profile) return;

    // Get the user's organization
    const { data: orgUserData, error: orgUserError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('profile_id', profile.user_id)
      .single();

    if (orgUserError || !orgUserData) {
      setError('Could not find your organization');
      return;
    }

    // Get the default priority for the user's organization
    const { data: orgData } = await supabase
      .from('organizations')
      .select('default_priority_id')
      .eq('id', orgUserData.organization_id)
      .single();

    // If no default priority is set for the organization, get the lowest priority
    let priorityId = orgData?.default_priority_id;
    if (!priorityId) {
      const { data: priorityData } = await supabase
        .from('priorities')
        .select('id')
        .eq('name', 'Low')
        .eq('is_active', true)
        .single();
      
      if (!priorityData) {
        setError('Could not find a valid priority');
        return;
      }
      priorityId = priorityData.id;
    }

    // Get the "open" status
    const { data: statusData } = await supabase
      .from('statuses')
      .select('id')
      .eq('name', 'Open')
      .single();

    if (!statusData) {
      setError('Could not find open status');
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 1 week from now

    const ticketData: TablesInsert<'tickets'> = {
      title: "New Ticket",
      description: null,
      status_id: statusData.id,
      priority_id: priorityId,
      due_date: dueDate.toISOString(),
      creator_id: profile.user_id,
      organization_id: orgUserData.organization_id,
    };

    // Create ticket
    const { data: ticketResult, error: ticketError } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (ticketError) {
      setError(ticketError.message);
      return null;
    }

    // Create initial conversation message
    const conversationData: TablesInsert<'ticket_conversations'> = {
      ticket_id: ticketResult.id,
      profile_id: profile.user_id,
      text: message,
    };

    const { error: conversationError } = await supabase
      .from('ticket_conversations')
      .insert(conversationData);

    if (conversationError) {
      setError(conversationError.message);
    }

    return ticketResult;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile) return;

    const messageToSend = newMessage;
    setNewMessage(''); // Clear input immediately
    setLoading(true);
    setIsWaitingForAgent(true);
    setError(null);

    try {
      if (!selectedTicketId) {
        // Create a new ticket if no ticket is selected
        const ticket = await createNewTicket(messageToSend);
        if (ticket) {
          // Update tickets list immediately
          setUserTickets(prev => [ticket, ...prev]);
          setSelectedTicketId(ticket.id);
          
          // Add user message to UI immediately
          const userMessage = {
            id: Date.now().toString(),
            ticket_id: ticket.id,
            profile_id: profile.user_id,
            text: messageToSend,
            created_at: new Date().toISOString(),
            from_ai: false,
            profile: {
              user_id: profile.user_id,
              first_name: profile.first_name,
              last_name: profile.last_name
            }
          };
          setMessages([userMessage]);
          
          // Get AI response for the new ticket
          const { data: aiResponse, error: aiError } = await supabase.functions.invoke('helpAgent', {
            body: {
              ticketId: ticket.id,
              userMessage: messageToSend
            }
          });
          
          if (aiError) {
            setError('Failed to get AI response');
            return;
          }

          if (aiResponse?.output) {
            // Add AI response to conversation
            const aiConversationData: TablesInsert<'ticket_conversations'> = {
              ticket_id: ticket.id,
              profile_id: null,
              text: aiResponse.output,
              from_ai: true
            };

            const { data: savedAiMessage } = await supabase
              .from('ticket_conversations')
              .insert(aiConversationData)
              .select()
              .single();

            if (savedAiMessage) {
              // Add AI message to UI immediately
              setMessages(prev => [...prev, {
                ...savedAiMessage,
                profile: null,
                from_ai: true
              }]);
            }
          }

          // Refresh ticket data to get updated title/description
          const { data: updatedTicket } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', ticket.id)
            .single();

          if (updatedTicket) {
            setUserTickets(prev => prev.map(t => 
              t.id === updatedTicket.id ? updatedTicket : t
            ));
          }
        }
      } else {
        // Add user message to UI immediately
        const userMessage = {
          id: Date.now().toString(),
          ticket_id: selectedTicketId,
          profile_id: profile.user_id,
          text: messageToSend,
          created_at: new Date().toISOString(),
          from_ai: false,
          profile: {
            user_id: profile.user_id,
            first_name: profile.first_name,
            last_name: profile.last_name
          }
        };
        setMessages(prev => [...prev, userMessage]);

        // Add message to existing ticket
        const conversationData: TablesInsert<'ticket_conversations'> = {
          ticket_id: selectedTicketId,
          profile_id: profile.user_id,
          text: messageToSend,
        };

        const { error: conversationError } = await supabase
          .from('ticket_conversations')
          .insert(conversationData);

        if (conversationError) {
          setError('Failed to send message');
          return;
        }

        // Get AI response for the existing ticket
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke('helpAgent', {
          body: {
            ticketId: selectedTicketId,
            userMessage: messageToSend
          }
        });
        
        if (aiError) {
          setError('Failed to get AI response');
          return;
        }

        if (aiResponse?.output) {
          // Add AI response to conversation
          const aiConversationData: TablesInsert<'ticket_conversations'> = {
            ticket_id: selectedTicketId,
            profile_id: null,
            text: aiResponse.output,
            from_ai: true
          };

          const { data: savedAiMessage } = await supabase
            .from('ticket_conversations')
            .insert(aiConversationData)
            .select()
            .single();

          if (savedAiMessage) {
            // Add AI message to UI immediately
            setMessages(prev => [...prev, {
              ...savedAiMessage,
              profile: null,
              from_ai: true
            }]);
          }
        }

        // Refresh ticket data to get updated title/description
        const { data: updatedTicket } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', selectedTicketId)
          .single();

        if (updatedTicket) {
          setUserTickets(prev => prev.map(t => 
            t.id === updatedTicket.id ? updatedTicket : t
          ));
        }
      }
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    } finally {
      setLoading(false);
      setIsWaitingForAgent(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-[800px] h-[600px] rounded-lg shadow-lg p-4 flex ${
        isPowerMode ? 
        'bg-electric-purple border-4 border-hot-pink' : 
        'bg-white'
      }`}>
        {/* Sidebar with tickets */}
        <div className={`w-1/3 min-w-[250px] border-r ${
          isPowerMode ? 'border-hot-pink' : 'border-gray-200'
        } pr-4 overflow-y-auto`}>
          <h3 className={`text-lg font-bold mb-4 ${
            isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'
          }`}>
            Your Tickets
          </h3>
          <button
            onClick={() => {
              // Only create new conversation if we're not already in one
              if (selectedTicketId !== null || messages.length > 0) {
                setSelectedTicketId(null);
                setMessages([]);
              }
            }}
            className={`w-full mb-4 px-4 py-2 rounded ${
              isPowerMode ?
              'bg-hot-pink text-toxic-yellow hover:bg-pink-600 disabled:opacity-50' :
              'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            } ${(!selectedTicketId && messages.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!selectedTicketId && messages.length === 0}
          >
            New Conversation
          </button>
          <div className="space-y-2">
            {userTickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`p-3 rounded cursor-pointer break-words ${
                  isPowerMode ?
                  'bg-hot-pink text-toxic-yellow hover:bg-pink-600' :
                  'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${selectedTicketId === ticket.id ? 'ring-2 ring-offset-2 ' + (isPowerMode ? 'ring-toxic-yellow' : 'ring-blue-500') : ''}`}
              >
                <div className="font-medium break-words">{ticket.title || 'New Ticket'}</div>
                <div className="text-sm truncate">
                  {ticket.description || 'No description'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col pl-4 min-w-0">
          <h3 className={`text-lg font-bold mb-4 ${
            isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'
          }`}>
            Chat with Support
          </h3>

          {/* Messages area */}
          <div ref={messageContainerRef} className="flex-1 overflow-y-auto mb-4 pr-2">
            {loading && messages.length === 0 ? (
              <div className={`text-center ${
                isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
              }`}>
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className={`text-center ${
                isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
              }`}>
                {selectedTicketId ? 'No messages yet' : 'Start a new conversation'}
              </div>
            ) : (
              <>
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`mb-4 p-3 rounded-lg max-w-[85%] break-words ${
                      message.from_ai ? 
                      (isPowerMode ? 'bg-electric-purple bg-opacity-20 mr-8' : 'bg-gray-50 mr-8') :
                      message.profile_id === profile?.user_id ?
                      (isPowerMode ? 'bg-hot-pink bg-opacity-20 ml-8' : 'bg-blue-50 ml-8') :
                      (isPowerMode ? 'bg-electric-purple bg-opacity-20 mr-8' : 'bg-gray-50 mr-8')
                    }`}
                  >
                    <div className={`font-semibold mb-1 ${
                      isPowerMode ? 'text-toxic-yellow' : 'text-gray-900'
                    }`}>
                      {getFullName(message.from_ai ? null : message.profile)}
                    </div>
                    <div className={`whitespace-pre-wrap break-words ${
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
                ))}
                {isWaitingForAgent && (
                  <div className={`text-center py-2 ${
                    isPowerMode ? 'text-toxic-yellow' : 'text-gray-500'
                  }`}>
                    <span className="inline-block animate-bounce mr-1">•</span>
                    <span className="inline-block animate-bounce mr-1" style={{ animationDelay: '0.2s' }}>•</span>
                    <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>•</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className={`flex-1 px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange placeholder-hot-pink font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className={`px-4 py-2 rounded ${
                isPowerMode ?
                'bg-hot-pink text-toxic-yellow hover:bg-pink-600 font-comic disabled:opacity-50' :
                'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>

          {error && (
            <div className={`mt-2 text-red-500 ${
              isPowerMode ? 'font-comic animate-bounce' : ''
            }`}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}