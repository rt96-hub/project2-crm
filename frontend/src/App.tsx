import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Tickets } from './pages/Tickets'
import { Customers } from './pages/Customers'
import { KnowledgeBase } from './pages/KnowledgeBase'
import { Reporting } from './pages/Reporting'
import { DashboardLayout } from './components/DashboardLayout'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/reporting" element={<Reporting />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
