import { useState, useEffect } from 'react'
import { PageContainer } from '../components/PageContainer'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import type { Database } from '../types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface TeamMember extends Profile {
  open_tickets: number
}

interface TicketCount {
  profile_id: string
  count: number
}

export function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const { isPowerMode } = useTheme()

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        // Get all non-customer profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_customer', false)
          .order('created_at', { ascending: false })

        if (profilesError) throw profilesError

        // Get open ticket counts
        const { data: ticketCounts, error: ticketError } = await supabase
          .rpc('get_employee_open_ticket_counts')

        if (ticketError) throw ticketError

        // Combine the data
        const membersWithTickets = profiles.map(profile => ({
          ...profile,
          open_tickets: (ticketCounts as TicketCount[]).find(t => t.profile_id === profile.user_id)?.count || 0
        }))

        setTeamMembers(membersWithTickets)
      } catch (error) {
        console.error('Error fetching team members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamMembers()
  }, [])

  return (
    <PageContainer title="Team">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className={`text-2xl ${isPowerMode ? 'animate-spin text-hot-pink' : 'text-gray-600'}`}>
            {isPowerMode ? '🌀' : 'Loading...'}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className={`text-2xl font-bold ${
            isPowerMode ? 'text-hot-pink animate-bounce' : 'text-gray-800'
          }`}>
            {isPowerMode ? (
              <>
                👥 Meet Our Awesome Team! 🚀
                <div className="text-lg mt-2 text-neon-green animate-pulse">
                  Making customer support magical! ✨
                </div>
              </>
            ) : null}
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`${isPowerMode ? 'bg-electric-purple' : 'bg-gray-50'}`}>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Open Tickets
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr 
                    key={member.user_id}
                    className={`${isPowerMode ? 'hover:bg-neon-green/10' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.job_title || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${member.open_tickets > 0
                          ? isPowerMode
                            ? 'bg-hot-pink text-toxic-yellow'
                            : 'bg-yellow-100 text-yellow-800'
                          : isPowerMode
                            ? 'bg-neon-green text-electric-purple'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {member.open_tickets}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  )
} 