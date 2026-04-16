import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'
import BookingModal from '../components/BookingModal'

export default function UserDashboard() {
  const [profile, setProfile] = useState({ email: '', name: '' })
  const [authLoading, setAuthLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const navigate = useNavigate()
  const userEmail = profile.email
  const userName = profile.name

  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await campusApi.get('/auth/me')
        const { email, name, role } = response.data
        localStorage.setItem('smart-campus-user-email', email)
        localStorage.setItem('smart-campus-user-name', name)
        localStorage.setItem('smart-campus-role', role)
        setProfile({ email, name: name || email })
        await Promise.all([loadBookings(), loadResources()])
      } catch (err) {
        navigate('/login')
      } finally {
        setAuthLoading(false)
      }
    }

    initialize()
  }, [])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const response = await campusApi.get('/user/bookings')
      setBookings(response.data)
    } catch (err) {
      setError('Failed to load your bookings.')
    } finally {
      setLoading(false)
    }
  }

  const loadResources = async () => {
    try {
      const response = await campusApi.get('/resources/public')
      setResources(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  const triggerCancel = (bookingId) => {
    setCancelBookingId(bookingId)
    setCancelReason('')
    setCancelModalOpen(true)
  }

  const handleCancelConfirm = async () => {
    if (!cancelBookingId) return
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation.")
      return
    }

    try {
      await campusApi.put(`/user/bookings/${cancelBookingId}/cancel`, null, {
        params: {
          reason: cancelReason
        }
      })
      loadBookings()
      setCancelModalOpen(false)
      setCancelBookingId(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking')
    }
  }

  const handleLogout = async () => {
    try {
      await campusApi.post('/auth/logout')
    } catch (err) {
      console.error(err)
    }
    localStorage.removeItem('smart-campus-user-email')
    localStorage.removeItem('smart-campus-user-name')
    localStorage.removeItem('smart-campus-role')
    navigate('/')
  }

  const upcomingBookings = bookings.filter(
    b => b.status === 'APPROVED' && new Date(`${b.bookingDate}T${b.endTime}`) >= new Date()
  )
  const historyBookings = bookings

  if (authLoading) {
    return null
  }

  return (
    <div className="admin-layout user-layout">
      <aside className="admin-sidebar user-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small user-mark">SC</div>
          <div>
            <h2>User Hub</h2>
            <p>Your portal</p>
          </div>
        </div>

        <div className="sidebar-nav-custom">
          <a href="#welcome" className="nav-item">✧ Welcome</a>
          <a href="#upcoming" className="nav-item">📅 Upcoming</a>
          <a href="#history" className="nav-item">📜 History</a>
        </div>

        <div style={{ marginTop: 'auto' }} className="sidebar-footer">
          <div className="user-profile-sm">
            <div className="avatar bg-gradient">{userName.charAt(0).toUpperCase()}</div>
            <div className="profile-text">
              <strong>{userName}</strong>
              <span>{userEmail}</span>
            </div>
          </div>
          <button className="btn-secondary sidebar-btn full-width" style={{ marginTop: '16px' }} onClick={handleLogout}>Log Out</button>
        </div>
      </aside>

      <main className="admin-main user-main">
        <section id="welcome" className="admin-header user-header glass-panel">
          <div className="hero-content-wrapper">
            <span className="eyebrow fade-in">Welcome back,</span>
            <h1 className="gradient-text slide-up">{userName}</h1>
            <p className="delay-1">Manage your campus resource reservations, check availability, and request new bookings effortlessly.</p>
          </div>
          <div className="hero-action delay-2">
            <button className="btn-primary pulse-btn huge-btn" onClick={() => setIsModalOpen(true)}>
              + Book a Resource
            </button>
          </div>
        </section>

        <section id="upcoming" className="user-section">
          <div className="section-header-row">
            <h2>Upcoming Bookings</h2>
            <span className="badge counter-badge">{upcomingBookings.length} Active</span>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="empty-state custom-empty glass-empty">
              <span className="empty-icon">📭</span>
              <p>You have no upcoming approved bookings.</p>
              <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={() => setIsModalOpen(true)}>Book Something</button>
            </div>
          ) : (
            <div className="resource-grid premium-grid">
              {upcomingBookings.map(b => (
                <div key={b.id} className="resource-card booking-card premium-booking accent-green">
                  <div className="resource-top">
                    <span className="badge resource-badge">{b.resourceName}</span>
                    <span className="status approved dot-status">APPROVED</span>
                  </div>
                  <h3 className="booking-date">{b.bookingDate}</h3>
                  <div className="booking-time-wrap">
                    <p>⏱ {b.startTime} - {b.endTime}</p>
                  </div>
                  <p className="purpose-text">"{b.purpose}"</p>
                  <button className="btn-danger full-width hover-lift" onClick={() => triggerCancel(b.id)}>Cancel Booking</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="history" className="user-section admin-panel-box glass-panel-soft">
          <div className="panel-top">
            <div>
              <span className="eyebrow">Your Activity</span>
              <h2>Booking History</h2>
              <p>Track the status of all your past and pending requests.</p>
            </div>
          </div>

          {error && <p className="error-text error-banner">{error}</p>}

          <div className="table-wrap premium-table-wrap">
            <table className="booking-table user-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Resource</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      <div className="loader"></div> Loading...
                    </td>
                  </tr>
                ) : historyBookings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No booking history yet.</td>
                  </tr>
                ) : (
                  historyBookings.map(b => (
                    <tr key={b.id} className="table-row-hover">
                      <td className="font-mono">{b.bookingCode}</td>
                      <td className="font-semibold">{b.resourceName}</td>
                      <td>
                        <div className="date-time-cell">
                          <span className="t-date">{b.bookingDate}</span>
                          <span className="t-time text-muted" style={{ display: 'block', fontSize: '0.85rem' }}>{b.startTime} - {b.endTime}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status ${String(b.status).toLowerCase()} pill-status`}>
                          {b.status}
                        </span>
                        {b.decisionReason && (
                          <span className="reason-tooltip premium-tooltip" title={b.decisionReason}> ℹ️</span>
                        )}
                      </td>
                      <td>
                        {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                          <button className="btn-danger small-btn ghost-danger" onClick={() => triggerCancel(b.id)}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <BookingModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false)
            loadBookings()
          }}
          resources={resources}
          userEmail={userEmail}
          userName={userName}
        />
      )}

      {cancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content popup-anim">
            <button className="close-btn" onClick={() => setCancelModalOpen(false)}>×</button>
            <h2 style={{ margin: '0 0 8px 0' }}>Cancel Booking</h2>
            <p className="text-muted" style={{ marginBottom: '20px', fontSize: '0.9rem' }}>Please provide a reason for cancellation.</p>
            <div className="form-group">
              <label>Reason Type</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                required
              >
                <option value="">Select a reason</option>
                <option value="Schedule Conflict">Schedule Conflict</option>
                <option value="No longer needed">No longer needed</option>
                <option value="Booked wrong resource">Booked wrong resource</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button className="btn-danger full-width" style={{ marginTop: '24px' }} onClick={handleCancelConfirm}>
              Confirm Cancellation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}