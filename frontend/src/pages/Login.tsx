import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { ThemeToggle } from '../components/ThemeToggle'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { isPowerMode } = useTheme()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      navigate('/dashboard')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      navigate('/dashboard')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden
      ${isPowerMode ? 
        'bg-[repeating-radial-gradient(circle,#FF69B4,#39FF14_30px,#9B30FF_60px)]' : 
        'bg-gray-50'
      }`}
    >
      <ThemeToggle />
      <div className="max-w-md w-full space-y-8 relative">
        <div className={`text-center ${isPowerMode ? 'transform -rotate-6' : ''}`}>
          <h1 className={`mb-2 ${isPowerMode ? 
            'text-6xl font-comic text-toxic-yellow animate-bounce' : 
            'text-4xl font-bold text-gray-900'
          }`}>
            {isPowerMode ? '🤡 MadTable 🎭' : 'MadTable'}
          </h1>
          {isPowerMode && (
            <>
              <div className="text-8xl animate-pulse mb-8">
                😡 (╯°□°)╯︵ ┻━┻
              </div>
              <h2 className="text-3xl font-papyrus text-neon-green animate-[spin_3s_linear_infinite] inline-block">
                Login or Sign Up... if you dare!
              </h2>
            </>
          )}
          {!isPowerMode && (
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          )}
        </div>
        <form className={`mt-8 space-y-6 ${isPowerMode ? 
          'bg-electric-purple p-8 rounded-lg transform rotate-2 shadow-[0_0_30px_10px_#FF69B4]' :
          ''
        }`}
        data-testid="login-form">
          {error && (
            <div className={`rounded-md p-4 ${isPowerMode ? 
              'bg-eye-burn-orange animate-pulse' :
              'bg-red-50'
            }`}>
              <div className={`text-sm ${isPowerMode ? 
                'font-impact text-toxic-yellow' :
                'text-red-700'
              }`}>{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`appearance-none relative block w-full px-3 py-2 rounded-t-md focus:outline-none focus:z-10 sm:text-sm ${isPowerMode ?
                  'border-4 border-hot-pink bg-toxic-yellow placeholder-electric-purple text-eye-burn-orange focus:ring-4 focus:ring-neon-green focus:border-eye-burn-orange font-comic' :
                  'border border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder={isPowerMode ? '🤪 Your Email Here! 🤪' : 'Email address'}
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`appearance-none relative block w-full px-3 py-2 rounded-b-md focus:outline-none focus:z-10 sm:text-sm ${isPowerMode ?
                  'border-4 border-hot-pink bg-toxic-yellow placeholder-electric-purple text-eye-burn-orange focus:ring-4 focus:ring-neon-green focus:border-eye-burn-orange font-comic' :
                  'border border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder={isPowerMode ? '🔑 Super Secret Password! 🔑' : 'Password'}
              />
            </div>
          </div>

          <div className={`flex gap-4 ${isPowerMode ? 'transform -rotate-1' : ''}`}>
            <button
              type="submit"
              onClick={handleSignIn}
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 rounded-md focus:outline-none ${isPowerMode ?
                'border-4 border-neon-green text-lg font-brush text-toxic-yellow bg-eye-burn-orange hover:bg-hot-pink hover:scale-105 transition-all focus:ring-4 focus:ring-electric-purple' :
                'text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isPowerMode ? (loading ? '🤔' : '🎪') : ''} Sign in
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 rounded-md focus:outline-none ${isPowerMode ?
                'border-4 border-hot-pink text-lg font-brush text-toxic-yellow bg-electric-purple hover:bg-neon-green hover:scale-105 transition-all focus:ring-4 focus:ring-eye-burn-orange' :
                'text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }`}
            >
              {isPowerMode ? (loading ? '🤔' : '🎭') : ''} Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 