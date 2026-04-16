import { Link } from 'react-router-dom'

export default function SignupPage() {
  const oauthUrl = import.meta.env.VITE_OAUTH_GOOGLE_URL || 'http://localhost:8080/oauth2/authorization/google'

  const handleGoogleSignup = () => {
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
        
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Use Google to join the SmartCampus network.</p>

        <button
          type="button"
          className="btn-primary full-width auth-btn"
          onClick={handleGoogleSignup}
        >
          Sign up with Google
        </button>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
