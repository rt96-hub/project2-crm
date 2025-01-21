import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { useUser } from '../context/UserContext'
import { useState } from 'react'
import { createPortal } from 'react-dom'

interface ProfilePopoutProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfilePopout({ isOpen, onClose }: ProfilePopoutProps) {
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()
  const { profile, updateProfile } = useUser()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    work_phone: profile?.work_phone || '',
    job_title: profile?.job_title || ''
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        work_phone: formData.work_phone,
        job_title: formData.job_title
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  if (!isOpen) return null

  const menuItems = [
    { label: 'Preferences', icon: isPowerMode ? '🎪' : '🔧' },
    { label: 'Help & Support', icon: isPowerMode ? '🤡' : '❓' },
  ]

  const modalContent = (
    <div 
      role="dialog" 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Only close if clicking the backdrop (not the modal content)
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className={`w-[480px] rounded-lg shadow-lg p-6 ${
        isPowerMode ?
        'bg-electric-purple border-4 border-hot-pink animate-wiggle' :
        'bg-gray-700'
      }`}>
        <div className="space-y-4">
          <h2 className={`text-2xl font-bold mb-4 ${isPowerMode ? 'text-toxic-yellow' : 'text-white'}`}>
            Profile Information
          </h2>
          
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className={`block text-sm ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-300'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded mt-1 opacity-50"
                />
              </div>
              
              {isEditing ? (
                <>
                  <div>
                    <label className={`block text-sm ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-300'}`}>
                      First Name
                    </label>
                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      aria-label="first name"
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-300'}`}>
                      Last Name
                    </label>
                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      aria-label="last name"
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-300'}`}>
                      Phone Number
                    </label>
                    <input
                      name="work_phone"
                      value={formData.work_phone}
                      onChange={handleInputChange}
                      aria-label="phone number"
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-300'}`}>
                      Job Title
                    </label>
                    <input
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleInputChange}
                      aria-label="job title"
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded mt-1"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div>
                    <span className={`block text-sm ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-300'}`}>
                      Name
                    </span>
                    <span className="text-white">
                      {profile?.first_name} {profile?.last_name}
                    </span>
                  </div>
                  <div>
                    <span className={`block text-sm ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-300'}`}>
                      Phone Number
                    </span>
                    <span className="text-white">
                      {profile?.work_phone || 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className={`block text-sm ${isPowerMode ? 'text-toxic-yellow' : 'text-gray-300'}`}>
                      Job Title
                    </span>
                    <span className="text-white">
                      {profile?.job_title || 'Not set'}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          first_name: profile?.first_name || '',
                          last_name: profile?.last_name || '',
                          work_phone: profile?.work_phone || '',
                          job_title: profile?.job_title || ''
                        })
                      }}
                      className={`px-4 py-2 rounded ${
                        isPowerMode ?
                        'bg-gray-600 text-toxic-yellow hover:bg-gray-500' :
                        'bg-gray-600 text-white hover:bg-gray-500'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className={`px-4 py-2 rounded ${
                        isPowerMode ?
                        'bg-hot-pink text-toxic-yellow hover:bg-pink-600' :
                        'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`px-4 py-2 rounded ${
                      isPowerMode ?
                      'bg-hot-pink text-toxic-yellow hover:bg-pink-600' :
                      'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          <hr className={isPowerMode ? 'border-hot-pink border-2' : 'border-gray-600'} />
          
          {menuItems.map((item) => (
            <button 
              key={item.label}
              className={`w-full text-left px-4 py-2 rounded transition-all ${
                isPowerMode ?
                'text-toxic-yellow font-comic hover:bg-neon-green hover:text-eye-burn-orange hover:scale-105 hover:-rotate-2' :
                'text-white hover:bg-gray-600'
              }`}
            >
              <span className={`mr-2 ${isPowerMode ? 'animate-bounce inline-block' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
          
          <hr className={isPowerMode ? 'border-hot-pink border-2' : 'border-gray-600'} />
          
          <div className="flex justify-between">
            <button
              onClick={handleLogout}
              className={`text-left px-4 py-2 rounded transition-all ${
                isPowerMode ?
                'text-eye-burn-orange font-impact hover:bg-hot-pink hover:text-toxic-yellow hover:scale-105 hover:rotate-2 animate-pulse' :
                'text-red-400 hover:bg-gray-600'
              }`}
            >
              <span className={`mr-2 ${isPowerMode ? 'animate-spin inline-block' : ''}`}>
                {isPowerMode ? '💥' : '🚪'}
              </span>
              Logout
            </button>
            
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded ${
                isPowerMode ?
                'text-toxic-yellow hover:bg-neon-green hover:text-eye-burn-orange' :
                'text-gray-300 hover:bg-gray-600'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
} 