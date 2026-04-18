import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import campusApi from '../api/campusApi'

export default function AdminRoute({ children }) {
  const [role, setRole] = useState(localStorage.getItem('smart-campus-role'))
  const [loading, setLoading] = useState(!role)

  useEffect(() => {
    if (role) {
      setLoading(false)
      return
    }

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
  }, [role])

  if (loading) {
    return null
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/admin-login" replace />
  }

  return children
}
