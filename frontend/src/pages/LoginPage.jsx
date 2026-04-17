import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { User, Wrench, UserPlus, ShieldAlert, LogIn } from 'lucide-react'
import campusApi from '../api/campusApi'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const userOauthUrl = import.meta.env.VITE_OAUTH_USER_URL || 'http://localhost:8080/api/auth/google/user'
  const technicianOauthUrl = import.meta.env.VITE_OAUTH_TECH_URL || 'http://localhost:8080/api/auth/google/technician'

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('oauth') === 'success') {
      resolveSession(params.get('next'))
    } else if (params.get('oauth') === 'error') {
      setError('Google sign-in failed. Please try again.')
    }
  }, [location.search])

  const resolveSession = async (nextPath) => {
    setLoading(true)
    setError('')
    try {
      const response = await campusApi.get('/auth/me')
      const { email, name, role } = response.data
      localStorage.setItem('smart-campus-user-email', email)
      localStorage.setItem('smart-campus-user-name', name)
      localStorage.setItem('smart-campus-role', role)

      if (nextPath) {
        navigate(nextPath)
        return
      }

      if (role === 'ADMIN') {
        navigate('/admin')
      } else if (role === 'TECHNICIAN') {
        navigate('/technician')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Unable to load your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const clearSessionAndRedirect = async (targetUrl) => {
    try {
      await campusApi.post('/auth/logout')
    } catch (err) {
      // Ignore logout errors and continue to login.
    }

    localStorage.removeItem('smart-campus-user-email')
    localStorage.removeItem('smart-campus-user-name')
    localStorage.removeItem('smart-campus-role')
    window.location.href = targetUrl
  }

  const handleUserLogin = () => {
    clearSessionAndRedirect(userOauthUrl)
  }

  const handleTechnicianLogin = () => {
    clearSessionAndRedirect(technicianOauthUrl)
  }

  return (
    <div className="auth-page">
      <div className="auth-card popup-anim">
        <div className="brand-wrap center-brand">
          <div className="brand-mark">SC</div>
          <div>
            <div className="brand">SmartCampus</div>
            <div className="brand-sub">Operations Hub</div>
          </div>
        </div>
        
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Choose how you want to sign in.</p>

        {error && <p className="error-text error-banner">{error}</p>}

        <button
          type="button"
          className="btn-primary full-width auth-btn"
          onClick={handleUserLogin}
          disabled={loading}
        >
          {loading ? <LogIn size={20} className="spin" /> : <User size={20} />}
          {loading ? 'Checking session...' : 'Continue as User'}
        </button>

        <button
          type="button"
          className="btn-secondary full-width auth-btn auth-secondary-btn"
          onClick={handleTechnicianLogin}
          disabled={loading}
        >
          <Wrench size={20} className="text-secondary" />
          Continue as Technician
        </button>

        <Link to="/signup" className="btn-secondary full-width auth-btn auth-secondary-btn">
          <UserPlus size={20} className="text-secondary" />
          Create account
        </Link>

        <Link to="/admin-login" className="btn-secondary full-width auth-btn auth-secondary-btn">
          <ShieldAlert size={20} className="text-secondary" />
          Admin login
        </Link>
        
        <p className="auth-footer" style={{ marginTop: '30px' }}>Use Google for user or technician access.</p>
      </div>
    </div>
  )
}
