import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'

export default function AdminPanel() {
  const [summary, setSummary] = useState(null)
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    resource: '',
    date: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadSummary()
    loadBookings()
  }, [])

  const loadSummary = async () => {
    try {
      const response = await campusApi.get('/admin/dashboard/summary')
      setSummary(response.data)
    } catch (err) {
      setError('Failed to load summary data.')
    }
  }

  const loadBookings = async (customFilters = filters) => {
    try {
      setError('')
      const params = {}
      if (customFilters.status) params.status = customFilters.status
      if (customFilters.resource) params.resource = customFilters.resource
      if (customFilters.date) params.date = customFilters.date

      const response = await campusApi.get('/admin/bookings', { params })
      setBookings(response.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load bookings.')
    }
  }

  const handleFilterChange = (event) => {
    const nextFilters = {
      ...filters,
      [event.target.name]: event.target.value
    }
    setFilters(nextFilters)
  }

  const handleFilterSubmit = (event) => {
    event.preventDefault()
    loadBookings(filters)
  }

  const handleStatusUpdate = async (bookingId, status) => {
    let reason = ''

    if (status === 'REJECTED') {
      reason = window.prompt('Enter rejection reason') || ''
      if (!reason.trim()) {
        window.alert('Reason is required for rejection.')
        return
      }
    }

    try {
      await campusApi.put(`/admin/bookings/${bookingId}/status`, {
        status,
        reason
      })
      await loadSummary()
      await loadBookings(filters)
    } catch (err) {
      window.alert(err?.response?.data?.message || 'Status update failed.')
    }
  }

  const logoutAdmin = () => {
    localStorage.removeItem('smart-campus-role')
    navigate('/')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">SC</div>
          <div>
            <h2>Admin Panel</h2>
            <p>Campus control center</p>
          </div>
        </div>

        <a href="#dashboard">Dashboard</a>
        <a href="#bookings">Booking Review</a>
        <a href="#alerts">Recent Alerts</a>
        <button className="btn-secondary sidebar-btn" onClick={logoutAdmin}>Back to Home</button>
      </aside>

      <main className="admin-main">
        <section id="dashboard" className="admin-header">
          <div>
            <span className="eyebrow">Admin Overview</span>
            <h1>Smart Campus Dashboard</h1>
            <p>Monitor requests, review bookings, and keep the system organized from one premium admin interface.</p>
          </div>
          <button className="btn-primary">+ Add New Resource</button>
        </section>

        <section className="summary-grid">
          <div className="summary-card accent-blue">
            <h3>{summary?.pendingBookings ?? 0}</h3>
            <p>Pending Bookings</p>
          </div>
          <div className="summary-card accent-green">
            <h3>{summary?.approvedBookings ?? 0}</h3>
            <p>Approved</p>
          </div>
          <div className="summary-card accent-red">
            <h3>{summary?.rejectedBookings ?? 0}</h3>
            <p>Rejected</p>
          </div>
          <div className="summary-card accent-orange">
            <h3>{summary?.cancelledBookings ?? 0}</h3>
            <p>Cancelled</p>
          </div>
          <div className="summary-card accent-dark wide-card">
            <h3>{summary?.totalResources ?? 0}</h3>
            <p>Total Resources</p>
          </div>
        </section>

        <section id="bookings" className="admin-panel-box">
          <div className="panel-top">
            <div>
              <span className="eyebrow">Booking Workflow</span>
              <h2>Review and manage booking requests</h2>
              <p>Approve or reject pending requests and cancel approved bookings when necessary.</p>
            </div>
          </div>

          <form className="filter-bar admin-filter" onSubmit={handleFilterSubmit}>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <input
              type="text"
              name="resource"
              placeholder="Resource name"
              value={filters.resource}
              onChange={handleFilterChange}
            />

            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
            />

            <button type="submit" className="btn-primary">Apply Filters</button>
          </form>

          {error && <p className="error-text">{error}</p>}

          <div className="table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Requester</th>
                  <th>Resource</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Decision</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-state">No bookings found.</td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.bookingCode}</td>
                      <td>
                        <strong>{booking.requesterName}</strong>
                        <div className="small-text">{booking.requesterEmail}</div>
                      </td>
                      <td>{booking.resourceName}</td>
                      <td>{booking.bookingDate}</td>
                      <td>{booking.startTime} - {booking.endTime}</td>
                      <td>{booking.purpose}</td>
                      <td>
                        <span className={`status ${String(booking.status).toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>{booking.decisionReason || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                className="btn-success"
                                type="button"
                                onClick={() => handleStatusUpdate(booking.id, 'APPROVED')}
                              >
                                Approve
                              </button>
                              <button
                                className="btn-danger"
                                type="button"
                                onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {booking.status === 'APPROVED' && (
                            <button
                              className="btn-warning"
                              type="button"
                              onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="alerts" className="admin-panel-box">
          <div className="panel-top">
            <div>
              <span className="eyebrow">System Alerts</span>
              <h2>Recent updates</h2>
              <p>Quick insights for the admin team.</p>
            </div>
          </div>

          <div className="alert-list">
            {(summary?.recentAlerts || []).map((alert, index) => (
              <div className="alert-item" key={index}>{alert}</div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
