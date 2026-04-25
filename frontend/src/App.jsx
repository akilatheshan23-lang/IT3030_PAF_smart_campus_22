import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminPanel from './pages/AdminPanel'
import UserDashboard from './pages/UserDashboard'
import TechnicianDashboard from './pages/TechnicianDashboard'
import AdminRoute from './components/AdminRoute'
import TechnicianRoute from './components/TechnicianRoute'
import UserRoute from './components/UserRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route
          path="/dashboard"
          element={
            <UserRoute>
              <UserDashboard />
            </UserRoute>
          }
        />
        <Route
          path="/technician"
          element={
            <TechnicianRoute>
              <TechnicianDashboard />
            </TechnicianRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}