import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'
import BookingModal from '../components/BookingModal'
import ReportIssueModal from '../components/ReportIssueModal'
// Module C Components
import ReportIncident from '../components/ReportIncident'
import EditIncidentModal from '../components/EditIncidentModal'
import IncidentCommentsModal from '../components/IncidentCommentsModal'

export default function UserDashboard() {
  const [profile, setProfile] = useState({ email: '', name: '' })
  const [authLoading, setAuthLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  // Module C State Management
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  // Incident Reporting State
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportResourceId, setReportResourceId] = useState('')
  const [ticketSuccess, setTicketSuccess] = useState('')
  const [editTicket, setEditTicket] = useState(null)
  const [attachmentModal, setAttachmentModal] = useState({ open: false, ticketId: '', attachments: [] })
  const [deletingTicketId, setDeletingTicketId] = useState('')
  const [commentModal, setCommentModal] = useState({ open: false, ticketId: '', ticketLabel: '' })
  
  const navigate = useNavigate()
  const userEmail = profile.email
  const userName = profile.name
  const currentRole = localStorage.getItem('smart-campus-role') || 'USER'
  const notifications = [] // Placeholder for Module D

  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await campusApi.get('/auth/me')
        const { email, name, role } = response.data

        if (role === 'ADMIN') {
          navigate('/admin')
          return
        }

        if (role === 'TECHNICIAN') {
          navigate('/technician')
          return
        }

        localStorage.setItem('smart-campus-user-email', email)
        localStorage.setItem('smart-campus-user-name', name)
        localStorage.setItem('smart-campus-role', role)
        setProfile({ email, name: name || email })
        // Load all required modules for User
        await Promise.all([loadBookings(), loadResources(), loadTickets()])
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

  const loadTickets = async () => {
    try {
      const res = await campusApi.get('/incidents/user')
      setTickets(res.data || [])
    } catch (err) {
      console.error('Failed to load tickets', err)
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



  const handleReportIssue = async (issueData) => {
    try {
      await campusApi.post('/user/tickets', issueData)
      setIsIssueModalOpen(false)
      loadTickets()
    } catch (err) {
      alert('Failed to submit issue report.')
    }
  }

  const triggerCancel = (bookingId) => {
    setCancelBookingId(bookingId)
    setCancelReason('')
    setCancelModalOpen(true)
  }

  const openReportModal = (resourceId) => {
    setReportResourceId(resourceId || '')
    setReportModalOpen(true)
  }

  const openCommentModal = (ticket) => {
    if (!ticket?.id) return
    setCommentModal({
      open: true,
      ticketId: ticket.id,
      ticketLabel: getResourceName(ticket.resourceId)
    })
  }

  const getResourceName = (resourceId) => {
    const res = resources.find(r => r.id === resourceId)
    return res ? res.name : resourceId
  }

  const formatTicketStatus = (status) => {
    if (!status) return ''
    return String(status)
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handleDeleteTicket = async (ticketId) => {
    if (!ticketId) return
    const confirmed = window.confirm('Delete this ticket? This cannot be undone.')
    if (!confirmed) return

    setDeletingTicketId(ticketId)
    try {
      await campusApi.delete(`/incidents/${ticketId}`)
      await loadTickets()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete ticket')
    } finally {
      setDeletingTicketId('')
    }
  }

  const handleCancelConfirm = async () => {
    if (!cancelBookingId) return
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation.")
      return
    }

    try {
      await campusApi.put(`/user/bookings/${cancelBookingId}/cancel`, null, {
        params: { reason: cancelReason }
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

  if (authLoading) return null

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
          <a href="#catalogue" className="nav-item">🏛 Catalogue</a>
          <a href="#upcoming" className="nav-item">📅 Upcoming</a>
          <a href="#history" className="nav-item">📜 History</a>
          <a href="#tickets" className="nav-item">🧰 Tickets</a>
          <a href="#notifications" className="nav-item">🔔 Notifications</a>
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
            <p className="delay-1">Manage resources, bookings, incident tickets, and notifications in one workspace.</p>
          </div>
          <div className="hero-action delay-2">
            <button className="btn-primary pulse-btn huge-btn" onClick={() => setIsModalOpen(true)}>
              + Book a Resource
            </button>
          </div>
        </section>

        {ticketSuccess && <div className="success-banner">{ticketSuccess}</div>}

        <section id="catalogue" className="user-section admin-panel-box glass-panel-soft">
          <div className="panel-top">
            <div>
              <span className="eyebrow">Module A</span>
              <h2>Facilities & Assets Catalogue</h2>
              <p>Preview bookable spaces and equipment with key metadata.</p>
            </div>
          </div>

          {resources.length === 0 ? (
            <div className="empty-state custom-empty glass-empty">
              <span className="empty-icon">🏛</span>
              <p>No resources loaded yet.</p>
            </div>
          ) : (
            <div className="resource-grid premium-grid">
              {resources.map(resource => (
                <div key={resource.id} className="resource-card">
                  <div className="resource-top">
                    <span className="badge">{resource.type}</span>
                    <span className={`status ${String(resource.status).toLowerCase()}`}>{resource.status}</span>
                  </div>
                  <h3>{resource.name}</h3>
                  <p>{resource.location}</p>
                  <div className="resource-meta">
                    <span>Capacity: {resource.capacity}</span>
                    <span>{resource.availabilityWindow}</span>
                  </div>
                  <button className="btn-secondary small-btn full-width mt-3" onClick={() => openReportModal(resource.id)}>Report Issue</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="upcoming" className="user-section" style={{ marginBottom: '40px' }}>
          <div className="section-header-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>Upcoming Bookings</h2>
            <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '800' }}>
              {upcomingBookings.length} Active
            </span>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="empty-state custom-empty glass-empty">
              <span className="empty-icon">📭</span>
              <p>You have no upcoming approved bookings.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {upcomingBookings.map(b => (
                <div key={b.id} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  padding: '28px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: '1px solid rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '8px 16px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '800' }}>
                      {b.resourceName}
                    </span>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '8px 16px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.05em' }}>
                      APPROVED
                    </span>
                  </div>
                  <h3 style={{ margin: '8px 0 0 0', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    {b.bookingDate}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '0.95rem', gap: '8px' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
                    <span>{b.startTime} - {b.endTime}</span>
                  </div>
                  <p style={{ margin: '0 0 12px 0', color: '#64748b', fontStyle: 'italic', fontSize: '0.95rem' }}>
                    "{b.purpose}"
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      className="hover-lift"
                      style={{
                        backgroundColor: '#da292e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 28px',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        flex: '1'
                      }}
                      onClick={() => triggerCancel(b.id)}
                    >
                      Cancel Booking
                    </button>
                    <button 
                      className="btn-secondary hover-lift"
                      style={{
                        borderRadius: '12px',
                        padding: '12px 28px',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                        flex: '1'
                      }}
                      onClick={() => openReportModal(b.resourceId)}
                    >
                      Report Issue
                    </button>
                  </div>
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
              <p>Track the status of all your requests.</p>
            </div>
          </div>
          <div className="table-wrap premium-table-wrap">
            <table className="booking-table user-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Resource</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Decision</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="empty-state">Loading...</td></tr>
                ) : historyBookings.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">No history yet.</td></tr>
                ) : (
                  historyBookings.map(b => (
                    <tr key={b.id} className="table-row-hover">
                      <td className="font-mono">{b.bookingCode}</td>
                      <td className="font-semibold">{b.resourceName}</td>
                      <td>{b.bookingDate} ({b.startTime})</td>
                      <td><span className={`status ${String(b.status).toLowerCase()} pill-status`}>{b.status}</span></td>
                      <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{b.decisionReason || '-'}</td>
                      <td>
                        {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                          <button className="btn-danger small-btn ghost-danger" onClick={() => triggerCancel(b.id)}>Cancel</button>
                        )}
                        <button className="btn-secondary small-btn ghost ml-2" onClick={() => openReportModal(b.resourceId)}>Report</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="tickets" className="user-section admin-panel-box glass-panel-soft">
          <div className="panel-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="eyebrow">Module C</span>
              <h2>Maintenance & Incident Tickets</h2>
              <p>Track incident reports for your requested resources.</p>
            </div>
            <button className="btn-secondary auth-secondary-btn" onClick={() => setIsIssueModalOpen(true)}>
              Report Issue
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="empty-state custom-empty glass-empty">
              <span className="empty-icon">🧰</span>
              <p>No incident tickets yet.</p>
            </div>
          ) : (
            <div className="resource-grid premium-grid">
              {tickets.map(ticket => (
                <div key={ticket.id} className="resource-card booking-card">
                  <div className="resource-top">
                    <span className="badge">{ticket.ticketCode || getResourceName(ticket.resourceId)}</span>
                    <span className={`status ${String(ticket.status).toLowerCase()} dot-status`}>
                      {formatTicketStatus(ticket.status) || ticket.status}
                    </span>
                  </div>
                  <h3 style={{ margin: '14px 0 6px 0', fontSize: '1.05rem' }}>{ticket.category} Update</h3>
                  <div className="resource-meta" style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '0.85rem' }}>Priority: <strong style={{ color: ticket.priority === 'HIGH' ? 'var(--danger)' : 'inherit' }}>{ticket.priority}</strong></span>
                    <span style={{ fontSize: '0.85rem' }}>Loc: {ticket.resourceId || ticket.location}</span>
                  </div>
                  <p className="purpose-text" style={{ fontSize: '0.9rem', color: 'var(--text)' }}>"{ticket.description}"</p>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <button className="btn-secondary small-btn" disabled={!ticket.attachments?.length} onClick={() => setAttachmentModal({ open: true, ticketId: ticket.id, attachments: ticket.attachments || [] })}>
                      {ticket.attachments?.length || 0} files
                    </button>
                    <button className="btn-secondary small-btn ghost" onClick={() => openCommentModal(ticket)}>Comments</button>
                    {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                      <button className="btn-secondary small-btn" onClick={() => setEditTicket(ticket)}>Edit</button>
                    )}
                    <button className="btn-danger small-btn ghost-danger" disabled={deletingTicketId === ticket.id} onClick={() => handleDeleteTicket(ticket.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="notifications" className="user-section admin-panel-box glass-panel-soft">
          <div className="panel-top">
            <div>
              <span className="eyebrow">Module D</span>
              <h2>Notifications</h2>
              <p>Stay updated on booking and ticket changes.</p>
            </div>
          </div>
          <div className="empty-state custom-empty glass-empty">
            <span className="empty-icon">🔔</span>
            <p>No notifications yet.</p>
          </div>
        </section>
      </main>

      {/* Modals for Bookings, Reporting, and Editing */}
      {isModalOpen && (
        <BookingModal onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); loadBookings(); }} resources={resources} userEmail={userEmail} userName={userName} />
      )}

      {reportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content popup-anim">
            <ReportIncident defaultResourceId={reportResourceId} onSuccess={() => { setReportModalOpen(false); loadTickets(); setTicketSuccess('Incident reported'); setTimeout(() => setTicketSuccess(''), 3000); }} onClose={() => setReportModalOpen(false)} />
          </div>
        </div>
      )}

      {editTicket && (
        <EditIncidentModal ticket={editTicket} resources={resources} onClose={() => setEditTicket(null)} onSaved={() => { loadTickets(); setEditTicket(null); }} />
      )}

      {attachmentModal.open && (
        <div className="modal-overlay" onClick={() => setAttachmentModal({ open: false, ticketId: '', attachments: [] })}>
          <div className="modal-content popup-anim" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" type="button" onClick={() => setAttachmentModal({ open: false, ticketId: '', attachments: [] })}>&times;</button>
            <h2 style={{marginTop: 0}}>Ticket Evidence</h2>
            <div className="attachment-grid">
              {attachmentModal.attachments.map((src, i) => (
                <div className="attachment-card" key={i}><img src={src} alt="Evidence" /></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isIssueModalOpen && (
        <ReportIssueModal
          onClose={() => setIsIssueModalOpen(false)}
          onSubmit={handleReportIssue}
        />
      )}

      {cancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content popup-anim">
            <button className="close-btn" onClick={() => setCancelModalOpen(false)}>×</button>
            <h2>Cancel Booking</h2>
            <div className="form-group">
              <label>Reason</label>
              <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} required>
                <option value="">Select a reason</option>
                <option value="Schedule Conflict">Schedule Conflict</option>
                <option value="No longer needed">No longer needed</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button className="btn-danger full-width mt-4" onClick={handleCancelConfirm}>Confirm</button>
          </div>
        </div>
      )}

      {commentModal.open && (
        <IncidentCommentsModal ticketId={commentModal.ticketId} ticketLabel={commentModal.ticketLabel} currentEmail={userEmail} currentRole={currentRole} onClose={() => setCommentModal({ open: false, ticketId: '', ticketLabel: '' })} />
      )}
    </div>
  )
}