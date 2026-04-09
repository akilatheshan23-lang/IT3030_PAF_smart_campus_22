import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'
import BookingModal from '../components/BookingModal'

export default function UserDashboard() {
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()
  const userEmail = localStorage.getItem('smart-campus-user-email') || 'student@example.com'
  const userName = localStorage.getItem('smart-campus-user-name') || 'Student'

  useEffect(() => {
    if (!localStorage.getItem('smart-campus-user-email')) {
      localStorage.setItem('smart-campus-user-email', 'student@example.com')
      localStorage.setItem('smart-campus-user-name', 'Student User')
    }
    loadBookings()
    loadResources()
  }, [])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const response = await campusApi.get(`/user/bookings?email=${userEmail}`)
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

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    try {
      await campusApi.put(`/user/bookings/${bookingId}/cancel?email=${userEmail}`)
      loadBookings()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('smart-campus-user-email')
    localStorage.removeItem('smart-campus-user-name')
    navigate('/')
  }

  const upcomingBookings = bookings.filter(
    b => b.status === 'APPROVED' && new Date(`${b.bookingDate}T${b.endTime}`) >= new Date()
  )
  const historyBookings = bookings

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
          <button className="btn-secondary sidebar-btn full-width" style={{marginTop: '16px'}} onClick={handleLogout}>Log Out</button>
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
              <button className="btn-secondary" style={{marginTop: '16px'}} onClick={() => setIsModalOpen(true)}>Book Something</button>
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
                  <button className="btn-warning full-width hover-lift" onClick={() => handleCancelBooking(b.id)}>Cancel Booking</button>
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
                          <span className="t-time text-muted" style={{display: 'block', fontSize: '0.85rem'}}>{b.startTime} - {b.endTime}</span>
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
                          <button className="btn-warning small-btn ghost-warning" onClick={() => handleCancelBooking(b.id)}>
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
    </div>
  )
}