import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Tickets } from './pages/Tickets'
import { TicketDetail } from './pages/TicketDetail'
import { Customers } from './pages/Customers'
import { CustomerDetail } from './pages/CustomerDetail'
import { KnowledgeBase } from './pages/KnowledgeBase'
import { Reporting } from './pages/Reporting'
import { Admin } from './pages/Admin'
import { Users } from './pages/admin/Users'
import { TicketStatuses } from './pages/admin/TicketStatuses'
import { Priorities } from './pages/admin/Priorities'
import { OrganizationTypes } from './pages/admin/OrganizationTypes'
import { OrganizationStatuses } from './pages/admin/OrganizationStatuses'
import { Organizations } from './pages/admin/Organizations'
import { DashboardLayout } from './components/DashboardLayout'
import { ThemeProvider } from './context/ThemeContext'
import { UserProvider } from './context/UserContext'
import { Team } from './pages/Team'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/team" element={<Team />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/reporting" element={<Reporting />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/organizations" element={<Organizations />} />
              <Route path="/admin/ticket-statuses" element={<TicketStatuses />} />
              <Route path="/admin/priorities" element={<Priorities />} />
              <Route path="/admin/org-types" element={<OrganizationTypes />} />
              <Route path="/admin/org-statuses" element={<OrganizationStatuses />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ThemeProvider>
  )
}

export default App
