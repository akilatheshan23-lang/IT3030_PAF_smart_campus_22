import { Link } from 'react-router-dom'

export default function SignupPage() {
  const userOauthUrl = import.meta.env.VITE_OAUTH_USER_URL || 'http://localhost:8080/api/auth/google/user'
  const technicianOauthUrl = import.meta.env.VITE_OAUTH_TECH_URL || 'http://localhost:8080/api/auth/google/technician'

  const handleUserSignup = () => {
    window.location.href = userOauthUrl
  }

  const handleTechnicianSignup = () => {
    window.location.href = technicianOauthUrl
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
        
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Sign up with Google as a user or technician.</p>

        <button
          type="button"
          className="btn-primary full-width auth-btn"
          onClick={handleUserSignup}
        >
          Sign up as User
        </button>

        <button
          type="button"
          className="btn-secondary full-width auth-btn auth-secondary-btn"
          onClick={handleTechnicianSignup}
        >
          Sign up as Technician
        </button>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
