import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import campusApi from '../api/campusApi'

export default function TechnicianRoute({ children }) {
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await campusApi.get('/auth/me')
        const { email, name, role: resolvedRole } = response.data
        localStorage.setItem('smart-campus-user-email', email)
        localStorage.setItem('smart-campus-user-name', name)
        localStorage.setItem('smart-campus-role', resolvedRole)
        setRole(resolvedRole)
      } catch (error) {
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (loading) {
    return null
  }

  if (role !== 'TECHNICIAN') {
    return <Navigate to="/login" replace />
  }

  return children
}
