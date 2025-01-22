import { useNavigate } from 'react-router-dom'
import { ConfigItemManager } from '../../components/ConfigItemManager'
import { useUser } from '../../context/UserContext'
import { useEffect } from 'react'

export function Priorities() {
  const navigate = useNavigate()
  const { profile } = useUser()

  useEffect(() => {
    if (!profile?.is_admin) {
      navigate('/dashboard')
    }
  }, [profile, navigate])

  return (
    <ConfigItemManager
      title="Ticket Priorities"
      tableName="priorities"
      onClose={() => navigate('/admin')}
    />
  )
} 