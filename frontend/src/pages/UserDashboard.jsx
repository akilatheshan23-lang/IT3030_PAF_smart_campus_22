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

        <a href="#welcome">Welcome</a>
        <a href="#upcoming">Upcoming</a>
        <a href="#history">Booking History</a>

        <div style={{ marginTop: 'auto' }}>
          <button className="btn-secondary sidebar-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </aside>

      <main className="admin-main user-main">
        <section id="welcome" className="admin-header user-header glass-panel">
          <div>
            <span className="eyebrow">Welcome back,</span>
            <h1>{userName}</h1>
            <p>Manage your campus resource reservations, check availability, and request new bookings.</p>
          </div>
          <button className="btn-primary pulse-btn" onClick={() => setIsModalOpen(true)}>
            + Book a Resource
          </button>
        </section>

        <section id="upcoming" className="user-section">
          <h2>Upcoming Bookings</h2>
          {upcomingBookings.length === 0 ? (
            <div className="empty-state custom-empty">You have no upcoming approved bookings.</div>
          ) : (
            <div className="resource-grid">
              {upcomingBookings.map(b => (
                <div key={b.id} className="resource-card booking-card accent-green">
                  <div className="resource-top">
                    <span className="badge">{b.resourceName}</span>
                    <span className="status approved">APPROVED</span>
                  </div>
                  <h3>{b.bookingDate}</h3>
                  <p>{b.startTime} - {b.endTime}</p>
                  <p className="purpose-text">"{b.purpose}"</p>
                  <button className="btn-warning full-width" onClick={() => handleCancelBooking(b.id)}>Cancel</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="history" className="user-section admin-panel-box">
          <div className="panel-top">
            <div>
              <span className="eyebrow">Your Activity</span>
              <h2>Booking History</h2>
              <p>Track the status of all your past and pending requests.</p>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="table-wrap">
            <table className="booking-table user-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Resource</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="empty-state">Loading...</td>
                  </tr>
                ) : historyBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">No booking history yet.</td>
                  </tr>
                ) : (
                  historyBookings.map(b => (
                    <tr key={b.id}>
                      <td>{b.bookingCode}</td>
                      <td>{b.resourceName}</td>
                      <td>{b.bookingDate}</td>
                      <td>{b.startTime} - {b.endTime}</td>
                      <td>
                        <span className={`status ${String(b.status).toLowerCase()}`}>
                          {b.status}
                        </span>
                        {b.decisionReason && (
                          <span className="reason-tooltip" title={b.decisionReason}> ℹ️</span>
                        )}
                      </td>
                      <td>
                        {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                          <button className="btn-warning small-btn" onClick={() => handleCancelBooking(b.id)}>
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