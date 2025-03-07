import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { ProfilePopout } from './ProfilePopout'
import { useTheme } from '../context/ThemeContext'
import { useUser } from '../context/UserContext'
import { ThemeToggle } from './ThemeToggle'
import { HelpChatBubble } from './HelpChatBubble'

export function Sidebar() {
  const location = useLocation()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { isPowerMode } = useTheme()
  const { profile } = useUser()
  
  const navItems = [
    { path: '/dashboard', label: 'Home', icon: isPowerMode ? '🤪' : '🏠' },
    { path: '/tickets', label: 'Tickets', icon: isPowerMode ? '👻' : '🎫' },
    { path: '/customers', label: 'Customers', icon: isPowerMode ? '🤖' : '👥' },
    ...(profile?.is_customer ? [] : [
      { path: '/team', label: 'Team', icon: isPowerMode ? '🎭' : '👥' }
    ]),
    { path: '/knowledge-base', label: 'Knowledge Base', icon: isPowerMode ? '🎪' : '📚' },
    ...(profile?.is_customer ? [] : [
      { path: '/reporting', label: 'Reporting', icon: isPowerMode ? '🌈' : '📊' }
    ]),
    ...(profile?.is_admin ? [
      { path: '/admin', label: 'Admin', icon: isPowerMode ? '👑' : '⚙️' }
    ] : [])
  ]

  return (
    <div className={`h-screen w-64 p-4 fixed left-0 top-0 flex flex-col ${
      isPowerMode ?
      'bg-electric-purple text-toxic-yellow animate-wiggle' :
      'bg-gray-800 text-white'
    }`}>
      <div className="flex items-center justify-between mb-8">
        <div className={`p-2 ${
          isPowerMode ?
          'text-3xl font-comic animate-bounce bg-hot-pink rounded-lg transform -rotate-3' :
          'text-xl font-bold'
        }`}>
          <span className={isPowerMode ? 'inline-block' : ''}>
            {isPowerMode ? '🤡 MadTable 🎭' : 'MadTable'}
          </span>
        </div>
        <button 
          onClick={() => {/* TODO: Add notification handler */}} 
          className={`p-2 rounded-full transition-all ${
            isPowerMode ?
            'hover:bg-hot-pink transform hover:scale-110 hover:rotate-12' :
            'hover:bg-gray-700'
          }`}
        >
          <span className={`text-xl ${isPowerMode ? 'animate-bounce' : ''}`}>
            {isPowerMode ? '🤡📯' : '🔔'}
          </span>
        </button>
      </div>
      <nav className="flex-grow">
        {navItems.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center p-3 mb-2 rounded transition-all ${
              isPowerMode ?
              `font-papyrus text-lg hover:bg-neon-green hover:text-eye-burn-orange transform hover:scale-105 hover:-rotate-2 ${
                location.pathname === item.path ? 
                'bg-eye-burn-orange text-toxic-yellow font-impact animate-pulse' : 
                ''
              }` :
              `hover:bg-gray-700 ${
                location.pathname === item.path ? 'bg-gray-700' : ''
              }`
            }`}
            style={isPowerMode ? {
              animationDelay: `${index * 150}ms`,
              transform: location.pathname === item.path ? 'rotate(2deg)' : 'none'
            } : {}}
          >
            <span className={`mr-3 ${isPowerMode ? 'text-2xl animate-bounce' : ''}`}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="relative">
        {profile?.is_customer && <HelpChatBubble />}
        <ThemeToggle />
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={`flex items-center w-full p-3 rounded transition-all mt-2 ${
            isPowerMode ?
            'font-brush text-xl hover:bg-hot-pink transform hover:scale-105 hover:rotate-2' :
            'hover:bg-gray-700'
          }`}
        >
          <span className={`mr-3 ${isPowerMode ? 'animate-spin' : ''}`}>
            {isPowerMode ? '🎭' : '👤'}
          </span>
          Profile
        </button>
        <ProfilePopout 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
        />
      </div>
    </div>
  )
} 