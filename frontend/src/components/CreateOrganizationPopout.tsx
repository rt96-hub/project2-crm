import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { TablesInsert, Tables } from '../types/database.types'
import { createPortal } from 'react-dom'

interface CreateOrganizationPopoutProps {
  isOpen: boolean
  onClose: () => void
  onOrganizationCreated: () => void
}

export function CreateOrganizationPopout({ isOpen, onClose, onOrganizationCreated }: CreateOrganizationPopoutProps) {
  const { isPowerMode } = useTheme()
  const { profile } = useUser()
  const [formData, setFormData] = useState<{
    name: string
    description: string
    customer_since: string
    customer_type_id: string
    customer_status_id: string
    total_contract: string
    default_priority_id: string
  }>({
    name: '',
    description: '',
    customer_since: '',
    customer_type_id: '',
    customer_status_id: '',
    total_contract: '',
    default_priority_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [organizationTypes, setOrganizationTypes] = useState<Tables<'organization_types'>[]>([])
  const [organizationStatuses, setOrganizationStatuses] = useState<Tables<'organization_statuses'>[]>([])
  const [priorities, setPriorities] = useState<Tables<'priorities'>[]>([])

  useEffect(() => {
    async function fetchOptions() {
      // Fetch organization types
      const { data: typeData } = await supabase
        .from('organization_types')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (typeData) {
        setOrganizationTypes(typeData)
      }

      // Fetch organization statuses
      const { data: statusData } = await supabase
        .from('organization_statuses')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (statusData) {
        setOrganizationStatuses(statusData)
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
    }

    if (isOpen) {
      fetchOptions()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.is_admin) return

    setLoading(true)
    setError(null)

    try {
      const totalContractNumber = parseInt(formData.total_contract)
      if (isNaN(totalContractNumber) || totalContractNumber < 0) {
        throw new Error('Total contract must be a positive number or zero')
      }

      const organizationData: TablesInsert<'organizations'> = {
        name: formData.name,
        description: formData.description || null,
        customer_since: formData.customer_since || null,
        customer_type_id: formData.customer_type_id,
        customer_status_id: formData.customer_status_id,
        total_contract: totalContractNumber,
        default_priority_id: formData.default_priority_id,
      }

      const { error: createError } = await supabase
        .from('organizations')
        .insert(organizationData)

      if (createError) throw createError

      onOrganizationCreated()
      onClose()
      setFormData({
        name: '',
        description: '',
        customer_since: '',
        customer_type_id: '',
        customer_status_id: '',
        total_contract: '',
        default_priority_id: '',
      })
    } catch (error) {
      console.error('Error creating organization:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
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
          {isPowerMode ? '✨ Create Magical Organization ✨' : 'Create New Organization'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange placeholder-hot-pink font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
              placeholder="Enter organization name"
            />
          </div>

          {/* Description */}
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
              rows={3}
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange placeholder-hot-pink font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
              placeholder="Enter organization description (optional)"
            />
          </div>

          {/* Customer Since */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Customer Since
            </label>
            <input
              type="date"
              name="customer_since"
              value={formData.customer_since}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
            />
          </div>

          {/* Organization Type */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Organization Type
            </label>
            <select
              name="customer_type_id"
              value={formData.customer_type_id}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
            >
              <option value="">Select type</option>
              {organizationTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Organization Status */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Organization Status
            </label>
            <select
              name="customer_status_id"
              value={formData.customer_status_id}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
            >
              <option value="">Select status</option>
              {organizationStatuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          {/* Total Contract */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Total Contract (USD)
            </label>
            <input
              type="number"
              name="total_contract"
              value={formData.total_contract}
              onChange={handleInputChange}
              required
              min="0"
              step="1"
              className={`w-full px-3 py-2 rounded ${
                isPowerMode ?
                'bg-neon-green text-eye-burn-orange placeholder-hot-pink font-comic border-2 border-hot-pink' :
                'border border-gray-300'
              }`}
              placeholder="Enter total contract amount"
            />
          </div>

          {/* Default Priority */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              isPowerMode ? 'text-toxic-yellow' : 'text-gray-700'
            }`}>
              Default Priority
            </label>
            <select
              name="default_priority_id"
              value={formData.default_priority_id}
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
                (isPowerMode ? '✨ Create Magic! ✨' : 'Create Organization')
              }
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
} 