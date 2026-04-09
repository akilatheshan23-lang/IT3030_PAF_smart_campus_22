import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    if (!email || !password) return
    localStorage.setItem('smart-campus-user-email', email)
    localStorage.setItem('smart-campus-user-name', email.split('@')[0])
    navigate('/dashboard')
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
        <p className="auth-subtitle">Sign in to manage your bookings and resources.</p>
        
        <form onSubmit={handleLogin} className="booking-form auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="student@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="btn-primary full-width auth-btn">Sign In</button>
        </form>
        
        <p className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Create Account</Link>
        </p>
      </div>
    </div>
  )
}
