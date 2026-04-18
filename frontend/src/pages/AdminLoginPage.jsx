import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleAdminLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = new URLSearchParams()
      payload.append('username', username)
      payload.append('password', password)

      await campusApi.post('/auth/admin/login', payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const response = await campusApi.get('/auth/me')
      const { email, name, role } = response.data

      localStorage.setItem('smart-campus-user-email', email)
      localStorage.setItem('smart-campus-user-name', name)
      localStorage.setItem('smart-campus-role', role)

      navigate('/admin')
    } catch (err) {
      setError('Invalid admin credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-panel popup-anim">
        <div className="brand-wrap center-brand">
          <div className="brand-mark">SC</div>
          <div>
            <div className="brand">SmartCampus</div>
            <div className="brand-sub">Operations Hub</div>
          </div>
        </div>

        <h2 className="auth-title">Admin Access</h2>
        <p className="auth-subtitle">Sign in with admin credentials to manage the system.</p>

        {error && <p className="error-text error-banner">{error}</p>}

        <form onSubmit={handleAdminLogin} className="booking-form auth-form">
          <div className="form-group">
            <label>Admin Username</label>
            <input
              type="text"
              required
              placeholder="admin"
              value={username}
              onChange={event => setUsername(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Admin Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary full-width auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in as Admin'}
          </button>
        </form>

        <p className="auth-footer">
          Need user access? <Link to="/login" className="auth-link">Go to user login</Link>
        </p>
      </div>
    </div>
  )
}
