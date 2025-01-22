import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useTheme } from '../context/ThemeContext'

export function DashboardLayout() {
  const { isPowerMode } = useTheme()

  return (
    <div className={`flex min-h-screen w-full ${
      isPowerMode ? 
      'bg-[repeating-linear-gradient(45deg,#FF69B4_25px,#39FF14_50px,#9B30FF_75px,#FF4500_100px)]' : 
      'bg-gray-100'
    }`}>
      <Sidebar />
      <div className="flex-1 ml-64">
        <main className={`w-full h-full p-8 ${
          isPowerMode ? 
          'bg-opacity-90 bg-toxic-yellow font-comic' : 
          'bg-white'
        }`}>
          <div className={`rounded-lg ${
            isPowerMode ? 
            'bg-white bg-opacity-80 p-6 shadow-[0_0_20px_5px_#FF69B4] transform rotate-1' : 
            'p-4'
          }`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
} 