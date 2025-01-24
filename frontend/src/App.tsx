import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Tickets } from './pages/Tickets'
import { TicketDetail } from './pages/TicketDetail'
import { Customers } from './pages/Customers'
import { CustomerDetail } from './pages/CustomerDetail'
import { KnowledgeBase } from './pages/KnowledgeBase'
import { KnowledgeBaseArticle } from './pages/KnowledgeBaseArticle'
import { NewKnowledgeBaseArticle } from './pages/NewKnowledgeBaseArticle'
import { EditKnowledgeBaseArticle } from './pages/EditKnowledgeBaseArticle'
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
import { UserProvider, useUser } from './context/UserContext'
import { Team } from './pages/Team'
import { KnowledgeBaseCategories } from './pages/admin/KnowledgeBaseCategories'
import { HelpChatBubble } from './components/HelpChatBubble'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  )
}

function AppContent() {
  const { profile } = useUser();

  return (
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
          <Route path="/knowledge-base/new" element={<NewKnowledgeBaseArticle />} />
          <Route path="/knowledge-base/:id" element={<KnowledgeBaseArticle />} />
          <Route path="/knowledge-base/edit/:id" element={<EditKnowledgeBaseArticle />} />
          <Route path="/reporting" element={<Reporting />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/organizations" element={<Organizations />} />
          <Route path="/admin/ticket-statuses" element={<TicketStatuses />} />
          <Route path="/admin/priorities" element={<Priorities />} />
          <Route path="/admin/org-types" element={<OrganizationTypes />} />
          <Route path="/admin/org-statuses" element={<OrganizationStatuses />} />
          <Route path="/admin/knowledge-base-categories" element={<KnowledgeBaseCategories />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {profile?.is_customer && <HelpChatBubble />}
    </Router>
  )
}

export default App
