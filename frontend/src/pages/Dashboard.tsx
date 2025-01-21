import { PageContainer } from '../components/PageContainer'
import { useUser } from '../context/UserContext'
import { useTheme } from '../context/ThemeContext'

export function Dashboard() {
  const { profile, loading } = useUser()
  const { isPowerMode } = useTheme()

  return (
    <PageContainer title="Dashboard">
      {loading ? (
        <div className={`text-xl ${isPowerMode ? 'text-hot-pink animate-pulse' : 'text-gray-600'}`}>
          {isPowerMode ? '🌀 Loading...' : 'Loading...'}
        </div>
      ) : (
        <div className={`text-2xl font-bold ${
          isPowerMode ? 'text-hot-pink animate-bounce' : 'text-gray-800'
        }`}>
          {isPowerMode ? (
            <>
              🎉 Welcome to MadTable, {profile?.email}! 🎮
              <div className="text-lg mt-2 text-neon-green animate-pulse">
                Let's make some magic happen! ✨
              </div>
            </>
          ) : (
            `Welcome to MadTable, ${profile?.email}`
          )}
        </div>
      )}
    </PageContainer>
  )
}