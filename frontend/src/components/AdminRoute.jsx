import { Navigate } from 'react-router-dom'

export default function AdminRoute({ children }) {
  const role = localStorage.getItem('smart-campus-role')

  if (role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return children
}
