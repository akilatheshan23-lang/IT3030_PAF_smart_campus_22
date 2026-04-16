import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import campusApi from '../api/campusApi'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const oauthUrl = import.meta.env.VITE_OAUTH_GOOGLE_URL || 'http://localhost:8080/oauth2/authorization/google'

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

      navigate(role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err) {
      setError('Unable to load your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = oauthUrl
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
        
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in with your campus Google account.</p>

        {error && <p className="error-text error-banner">{error}</p>}

        <button
          type="button"
          className="btn-primary full-width auth-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? 'Checking session...' : 'Continue with Google'}
        </button>

        <Link to="/signup" className="btn-secondary full-width auth-btn auth-secondary-btn">
          Create account
        </Link>
        
        <p className="auth-footer">
          Already have an account? Continue with Google above.
        </p>
      </div>
    </div>
  )
}
