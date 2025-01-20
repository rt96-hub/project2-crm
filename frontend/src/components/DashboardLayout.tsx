import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 ml-64">
        <main className="w-full h-full bg-gray-100 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
} 