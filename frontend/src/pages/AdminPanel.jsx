import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'
import { 
  LogOut, LayoutDashboard, CalendarCheck, AlertTriangle, 
  Search, Calendar, ChevronDown
} from 'lucide-react'

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

  const logoutAdmin = async () => {
    try {
      await campusApi.post('/auth/logout')
    } catch (err) {
      console.error(err)
    }
    localStorage.removeItem('smart-campus-role')
    localStorage.removeItem('smart-campus-user-email')
    localStorage.removeItem('smart-campus-user-name')
    navigate('/')
  }

  return (
    <div className="admin-layout user-layout">
      <aside className="admin-sidebar user-sidebar">
        <div className="sidebar-brand" style={{marginBottom: '30px'}}>
          <div className="brand-mark small user-mark">SC</div>
          <div>
            <h2 style={{fontSize: '1.2rem', color: '#fff'}}>Admin Panel</h2>
            <p style={{margin:0, opacity: 0.8, fontSize: '0.85rem'}}>Control Center</p>
          </div>
        </div>

        <div className="sidebar-nav-custom">
           <a href="#dashboard" className="nav-item">
             <LayoutDashboard size={20} /> Dashboard
           </a>
           <a href="#bookings" className="nav-item">
             <CalendarCheck size={20} /> Booking Review
           </a>
           <a href="#alerts" className="nav-item">
             <AlertTriangle size={20} /> Alerts
           </a>
        </div>
        
        <div style={{marginTop: 'auto'}}>
          <button className="btn-secondary sidebar-btn" style={{width: '100%', display: 'flex', gap: '8px'}} onClick={logoutAdmin}>
             <LogOut size={18} /> Back to Home
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <section id="dashboard" className="admin-header user-header" style={{padding: '30px', borderRadius: '24px', marginBottom: '24px'}}>
          <div>
            <span className="eyebrow" style={{color: '#6d28d9'}}>Admin Overview</span>
            <h1 style={{color: '#1e1b4b'}}>Smart Campus Dashboard</h1>
            <p>Monitor requests, review bookings, and keep the system organized from one premium admin interface.</p>
          </div>
          <button className="btn-primary" style={{background: 'linear-gradient(135deg, #a78bfa, #6d28d9)', boxShadow: '0 10px 25px rgba(109, 40, 217, 0.3)'}}>+ Add Resource</button>
        </section>

        <section className="summary-grid">
          <div className="summary-card accent-blue booking-card">
            <h3 className="gradient-text">{summary?.pendingBookings ?? 0}</h3>
            <p>Pending Bookings</p>
          </div>
          <div className="summary-card accent-green booking-card">
            <h3 style={{color: '#059669'}}>{summary?.approvedBookings ?? 0}</h3>
            <p>Approved</p>
          </div>
          <div className="summary-card accent-red booking-card">
            <h3 style={{color: '#e11d48'}}>{summary?.rejectedBookings ?? 0}</h3>
            <p>Rejected</p>
          </div>
          <div className="summary-card accent-orange booking-card">
            <h3 style={{color: '#d97706'}}>{summary?.cancelledBookings ?? 0}</h3>
            <p>Cancelled</p>
          </div>
          <div className="summary-card accent-dark wide-card booking-card" style={{background: 'linear-gradient(135deg, #1e1b4b, #312e81)'}}>
            <h3>{summary?.totalResources ?? 0}</h3>
            <p>Total Resources</p>
          </div>
        </section>

        <section id="bookings" className="admin-panel-box user-section glass-panel-soft" style={{padding: '32px'}}>
          <div className="panel-top" style={{marginBottom: '28px'}}>
            <div>
              <span className="eyebrow" style={{color: '#2563eb'}}>Booking Workflow</span>
              <h2 style={{color: '#0f172a', fontSize: '1.6rem', marginTop: '4px'}}>Review and manage booking requests</h2>
              <p>Approve or reject pending requests and cancel approved bookings when necessary.</p>
            </div>
          </div>

          <form className="admin-search-bar" onSubmit={handleFilterSubmit}>
            <div className="filter-input-wrap">
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ChevronDown className="icon" size={18} style={{left: 'auto', right: '16px', color: '#64748b'}} />
            </div>

            <div className="filter-input-wrap">
              <input
                type="text"
                name="resource"
                placeholder="Resource name"
                value={filters.resource}
                onChange={handleFilterChange}
                style={{paddingLeft: '18px'}}
              />
            </div>

            <div className="filter-input-wrap">
              <Calendar className="icon" size={18} style={{left: 'auto', right: '16px', color: '#64748b'}} />
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                style={{color: filters.date ? '#334155' : '#94a3b8', paddingLeft: '18px'}}
              />
            </div>

            <button type="submit" className="btn-primary apply-btn" style={{background: '#3b82f6'}}>Apply Filters</button>
          </form>

          {error && (
            <div className="error-banner" style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px'}}>
              <AlertTriangle size={18}/> {error}
            </div>
          )}

          <div className="admin-table-container">
            <table className="booking-table modern-table">
              <thead>
                <tr>
                  <th className="table-header-custom" style={{width: '10%'}}>Code</th>
                  <th className="table-header-custom" style={{width: '18%'}}>Requester</th>
                  <th className="table-header-custom" style={{width: '12%'}}>Resource</th>
                  <th className="table-header-custom" style={{width: '10%'}}>Date</th>
                  <th className="table-header-custom" style={{width: '10%'}}>Time</th>
                  <th className="table-header-custom" style={{width: '12%'}}>Purpose</th>
                  <th className="table-header-custom" style={{width: '10%'}}>Status</th>
                  <th className="table-header-custom" style={{width: '13%'}}>Decision</th>
                  <th className="table-header-custom" style={{width: '5%'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <div className="custom-empty" style={{textAlign: 'center', margin: '40px 0'}}>
                        <CalendarCheck size={48} style={{color: '#cbd5e1', marginBottom: '16px'}}/>
                        <div style={{color: '#64748b'}}>No bookings found.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="table-row-hover">
                      <td style={{color: '#64748b'}}>{booking.bookingCode}</td>
                      <td className="cell-requester">
                        <strong>{booking.requesterName}</strong>
                        <div className="sub-text">{booking.requesterEmail}</div>
                      </td>
                      <td style={{color: '#334155', fontWeight: '500'}}>{booking.resourceName}</td>
                      <td style={{color: '#475569'}}>{booking.bookingDate}</td>
                      <td style={{color: '#475569'}}>{booking.startTime} - {booking.endTime}</td>
                      <td style={{color: '#475569'}}>{booking.purpose}</td>
                      <td>
                        <span className={`status-badge ${String(booking.status).toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td style={{color: '#64748b', fontSize: '0.9rem'}}>{booking.decisionReason || '-'}</td>
                      <td>
                        <div className="action-buttons-flex">
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                className="action-btn-custom approve"
                                type="button"
                                onClick={() => handleStatusUpdate(booking.id, 'APPROVED')}
                              >
                                Approve
                              </button>
                              <button
                                className="action-btn-custom reject"
                                type="button"
                                onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {booking.status === 'APPROVED' && (
                            <button
                              className="action-btn-custom cancel"
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

        <section id="alerts" className="admin-panel-box user-section glass-panel-soft">
          <div className="panel-top">
            <div>
              <span className="eyebrow" style={{color: '#e11d48'}}>System Alerts</span>
              <h2 style={{color: '#1e293b'}}>Recent updates</h2>
              <p>Quick insights for the admin team.</p>
            </div>
          </div>

          <div className="alert-list">
            {(summary?.recentAlerts || []).length > 0 ? summary.recentAlerts.map((alert, index) => (
              <div className="alert-item" style={{display: 'flex', gap: '12px', alignItems: 'center'}} key={index}>
                 <AlertTriangle size={20} color="#3b82f6" /> {alert}
              </div>
            )) : (
              <div style={{color: '#94a3b8', padding: '12px'}}>No recent alerts.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
