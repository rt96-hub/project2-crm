import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { ProfilePopout } from './ProfilePopout'

export function Sidebar() {
  const location = useLocation()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/tickets', label: 'Tickets', icon: '🎫' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/knowledge-base', label: 'Knowledge Base', icon: '📚' },
    { path: '/reporting', label: 'Reporting', icon: '📊' },
  ]

  return (
    <div className="h-screen w-64 bg-gray-800 text-white p-4 fixed left-0 top-0 flex flex-col">
      <div className="text-xl font-bold mb-8 p-2">CRM Dashboard</div>
      <nav className="flex-grow">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center p-3 mb-2 rounded hover:bg-gray-700 transition-colors ${
              location.pathname === item.path ? 'bg-gray-700' : ''
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="relative">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center w-full p-3 rounded hover:bg-gray-700 transition-colors"
        >
          <span className="mr-3">👤</span>
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