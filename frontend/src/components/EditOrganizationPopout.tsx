import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'
import type { OrganizationWithDetails } from './OrganizationTable'

type OrganizationType = Database['public']['Tables']['organization_types']['Row']
type OrganizationStatus = Database['public']['Tables']['organization_statuses']['Row']
type Priority = Database['public']['Tables']['priorities']['Row']

interface EditOrganizationPopoutProps {
  organization: OrganizationWithDetails
  isOpen: boolean
  onClose: () => void
  onOrganizationUpdated: () => void
}

export function EditOrganizationPopout({
  organization,
  isOpen,
  onClose,
  onOrganizationUpdated
}: EditOrganizationPopoutProps) {
  const { isPowerMode } = useTheme()
  const [name, setName] = useState(organization.name)
  const [description, setDescription] = useState(organization.description || '')
  const [customerSince, setCustomerSince] = useState(organization.customer_since || '')
  const [customerTypeId, setCustomerTypeId] = useState<string | null>(organization.customer_type_id)
  const [customerStatusId, setCustomerStatusId] = useState<string | null>(organization.customer_status_id)
  const [totalContract, setTotalContract] = useState(organization.total_contract?.toString() || '')
  const [defaultPriorityId, setDefaultPriorityId] = useState<string | null>(organization.default_priority_id)

  const [organizationTypes, setOrganizationTypes] = useState<OrganizationType[]>([])
  const [organizationStatuses, setOrganizationStatuses] = useState<OrganizationStatus[]>([])
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [
          { data: types },
          { data: statuses },
          { data: priorityList }
        ] = await Promise.all([
          supabase.from('organization_types').select('*').order('name'),
          supabase.from('organization_statuses').select('*').order('name'),
          supabase.from('priorities').select('*').order('name')
        ])

        setOrganizationTypes(types || [])
        setOrganizationStatuses(statuses || [])
        setPriorities(priorityList || [])
      } catch (error) {
        console.error('Error fetching dropdown data:', error)
      }
    }

    if (isOpen) {
      fetchDropdownData()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name,
          description,
          customer_since: customerSince || null,
          customer_type_id: customerTypeId,
          customer_status_id: customerStatusId,
          total_contract: totalContract ? parseFloat(totalContract) : null,
          default_priority_id: defaultPriorityId
        })
        .eq('id', organization.id)

      if (error) throw error

      onOrganizationUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating organization:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className={`rounded-lg p-6 max-w-2xl w-full mx-4 ${
        isPowerMode 
          ? 'bg-electric-purple border-4 border-hot-pink' 
          : 'bg-gray-700'
      }`}>
        <h2 className={`text-2xl font-bold mb-4 ${
          isPowerMode ? 'text-toxic-yellow font-impact animate-pulse' : 'text-white'
        }`}>
          Edit Organization
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-200'
            }`}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                isPowerMode
                  ? 'bg-neon-green text-electric-purple placeholder-hot-pink border-2 border-hot-pink focus:border-toxic-yellow focus:ring-toxic-yellow font-comic'
                  : 'bg-gray-600 border-gray-500 text-white focus:border-blue-500 focus:ring-blue-500'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-200'
            }`}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                isPowerMode
                  ? 'bg-neon-green text-electric-purple placeholder-hot-pink border-2 border-hot-pink focus:border-toxic-yellow focus:ring-toxic-yellow font-comic'
                  : 'bg-gray-600 border-gray-500 text-white focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-200'
            }`}>Customer Since</label>
            <input
              type="date"
              value={customerSince}
              onChange={(e) => setCustomerSince(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                isPowerMode
                  ? 'bg-neon-green text-electric-purple border-2 border-hot-pink focus:border-toxic-yellow focus:ring-toxic-yellow font-comic'
                  : 'bg-gray-600 border-gray-500 text-white focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-200'
            }`}>Organization Type</label>
            <select
              value={customerTypeId || ''}
              onChange={(e) => setCustomerTypeId(e.target.value || null)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                isPowerMode
                  ? 'bg-neon-green text-electric-purple border-2 border-hot-pink focus:border-toxic-yellow focus:ring-toxic-yellow font-comic'
                  : 'bg-gray-600 border-gray-500 text-white focus:border-blue-500 focus:ring-blue-500'
              }`}
            >
              <option value="">Select Type</option>
              {organizationTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-200'
            }`}>Organization Status</label>
            <select
              value={customerStatusId || ''}
              onChange={(e) => setCustomerStatusId(e.target.value || null)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                isPowerMode
                  ? 'bg-neon-green text-electric-purple border-2 border-hot-pink focus:border-toxic-yellow focus:ring-toxic-yellow font-comic'
                  : 'bg-gray-600 border-gray-500 text-white focus:border-blue-500 focus:ring-blue-500'
              }`}
            >
              <option value="">Select Status</option>
              {organizationStatuses.map((status) => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-200'
            }`}>Total Contract Value</label>
            <input
              type="number"
              step="0.01"
              value={totalContract}
              onChange={(e) => setTotalContract(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                isPowerMode
                  ? 'bg-neon-green text-electric-purple placeholder-hot-pink border-2 border-hot-pink focus:border-toxic-yellow focus:ring-toxic-yellow font-comic'
                  : 'bg-gray-600 border-gray-500 text-white focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-200'
            }`}>Default Priority</label>
            <select
              value={defaultPriorityId || ''}
              onChange={(e) => setDefaultPriorityId(e.target.value || null)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                isPowerMode
                  ? 'bg-neon-green text-electric-purple border-2 border-hot-pink focus:border-toxic-yellow focus:ring-toxic-yellow font-comic'
                  : 'bg-gray-600 border-gray-500 text-white focus:border-blue-500 focus:ring-blue-500'
              }`}
            >
              <option value="">Select Priority</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>{priority.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium ${
                isPowerMode
                  ? 'bg-electric-purple text-toxic-yellow hover:bg-hot-pink font-comic'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium ${
                isPowerMode
                  ? 'bg-neon-green text-electric-purple hover:bg-hot-pink hover:text-toxic-yellow font-comic disabled:opacity-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {loading ? (isPowerMode ? '🎭 Saving... 🎪' : 'Saving...') : (isPowerMode ? '✨ Save Changes ✨' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 