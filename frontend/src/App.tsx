import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Tickets } from './pages/Tickets'
import { Customers } from './pages/Customers'
import { KnowledgeBase } from './pages/KnowledgeBase'
import { Reporting } from './pages/Reporting'
import { Admin } from './pages/Admin'
import { DashboardLayout } from './components/DashboardLayout'
import { ThemeProvider } from './context/ThemeContext'
import { UserProvider } from './context/UserContext'
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
              <Route path="/customers" element={<Customers />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/reporting" element={<Reporting />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ThemeProvider>
  )
}

export default App
