import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'
import IncidentCommentsModal from '../components/IncidentCommentsModal'

export default function TechnicianDashboard() {
  const [profile, setProfile] = useState({ email: '', name: '' })
  const [authLoading, setAuthLoading] = useState(true)
  // Module C State Management
  const [assignedTickets, setAssignedTickets] = useState([])
  const [ticketError, setTicketError] = useState('')
  const [ticketLoading, setTicketLoading] = useState(true)
  const [attachmentModal, setAttachmentModal] = useState({ open: false, ticketId: '', attachments: [], index: 0 })
  const [resources, setResources] = useState([])
  const [resolvingTicketId, setResolvingTicketId] = useState('')
  const [commentModal, setCommentModal] = useState({ open: false, ticketId: '', ticketLabel: '' })
  const navigate = useNavigate()
  const notifications = [] // Placeholder for Module D [cite: 44]

  const currentEmail = profile.email
  const currentRole = localStorage.getItem('smart-campus-role') || 'TECHNICIAN'

  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await campusApi.get('/auth/me')
        const { email, name, role } = response.data

        if (role === 'ADMIN') {
          navigate('/admin')
          return
        }

        if (role !== 'TECHNICIAN') {
          navigate('/dashboard')
          return
        }

        localStorage.setItem('smart-campus-user-email', email)
        localStorage.setItem('smart-campus-user-name', name)
        localStorage.setItem('smart-campus-role', role)
        setProfile({ email, name: name || email })
        // Load operational data for Technician 
        await Promise.all([loadAssignedTickets(), loadResources()])
      } catch (err) {
        navigate('/login')
      } finally {
        setAuthLoading(false)
      }
    }

    initialize()
  }, [])

  const loadAssignedTickets = async () => {
    try {
      setTicketLoading(true)
      setTicketError('')
      const response = await campusApi.get('/technician/tickets')
      setAssignedTickets(response.data || [])
    } catch (err) {
      setTicketError(err?.response?.data?.message || 'Failed to load assigned tickets.')
      setAssignedTickets([])
    } finally {
      setTicketLoading(false)
    }
  }

  const loadResources = async () => {
    try {
      const response = await campusApi.get('/resources/public')
      setResources(response.data || [])
    } catch (err) {
      setResources([])
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await campusApi.put(`/technician/tickets/${id}/status`, null, {
        params: { status: newStatus }
      })
      loadAssignedTickets()
    } catch (err) {
      alert('Failed to update ticket status')
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
    navigate('/login')
  }

  const ticketSummary = {
    open: assignedTickets.filter(ticket => ticket.status === 'OPEN').length,
    inProgress: assignedTickets.filter(ticket => ticket.status === 'IN_PROGRESS').length,
    resolved: assignedTickets.filter(ticket => ticket.status === 'RESOLVED').length
  }

  const getTicketName = (ticket) => {
    const resource = resources.find(r => r.id === ticket.resourceId)
    return resource ? resource.name : (ticket.resourceId || ticket.id)
  }

  const openCommentModal = (ticket) => {
    if (!ticket?.id) return
    setCommentModal({
      open: true,
      ticketId: ticket.id,
      ticketLabel: getTicketName(ticket)
    })
  }

  const formatTicketStatus = (status) => {
    if (!status) return ''
    return String(status)
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (authLoading) return null

  return (
    <div className="admin-layout technician-layout">
      <aside className="admin-sidebar technician-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small technician-mark">SC</div>
          <div>
            <h2>Technician Desk</h2>
            <p>Maintenance & incidents</p>
          </div>
        </div>

        <div className="sidebar-nav-custom">
          <a href="#overview" className="nav-item">🛠 Overview</a>
          <a href="#tickets" className="nav-item">📌 Assigned Tickets</a>
          <a href="#notifications" className="nav-item">🔔 Notifications</a>
        </div>

        <div style={{ marginTop: 'auto' }} className="sidebar-footer">
          <div className="user-profile-sm">
            <div className="avatar bg-gradient">{profile.name.charAt(0).toUpperCase()}</div>
            <div className="profile-text">
              <strong>{profile.name}</strong>
              <span>{profile.email}</span>
            </div>
          </div>
          <button className="btn-secondary sidebar-btn full-width" style={{ marginTop: '16px' }} onClick={handleLogout}>Log Out</button>
        </div>
      </aside>

      <main className="admin-main technician-main">
        <section id="overview" className="admin-header user-header glass-panel">
          <div className="hero-content-wrapper">
            <span className="eyebrow fade-in">Technician console</span>
            <h1 className="gradient-text slide-up">Welcome, {profile.name}</h1>
            <p className="delay-1">Track incidents, update maintenance progress, and keep campus assets operational.</p>
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-card accent-blue">
            <h3>{ticketSummary.open}</h3>
            <p>Open Tickets</p>
          </div>
          <div className="summary-card accent-orange">
            <h3>{ticketSummary.inProgress}</h3>
            <p>In Progress</p>
          </div>
          <div className="summary-card accent-green">
            <h3>{ticketSummary.resolved}</h3>
            <p>Resolved</p>
          </div>
          <div className="summary-card accent-dark wide-card">
            <h3>{assignedTickets.length}</h3>
            <p>Total Assigned</p>
          </div>
        </section>

        <section id="tickets" className="admin-panel-box glass-panel-soft">
          <div className="panel-top">
            <div>
              <h2>Maintenance & Incident Tickets</h2>
              <p>Monitor tickets assigned to you and update their status with resolution notes.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Evidence</th>
                  <th>Assigned</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ticketLoading ? (
                  <tr><td colSpan="7" className="empty-state">Loading tickets...</td></tr>
                ) : assignedTickets.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">No tickets assigned yet.</td></tr>
                ) : (
                  assignedTickets.map(ticket => (
                    <tr key={ticket.id} className="table-row-hover">
                      <td className="font-mono"><strong>{ticket.ticketCode || getTicketName(ticket)}</strong></td>
                      <td>{ticket.category}</td>
                      <td>
                        <span style={{color: ticket.priority === 'HIGH' ? 'var(--danger)' : ticket.priority === 'MEDIUM' ? 'var(--warning)' : 'inherit', fontWeight: 'bold'}}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <select 
                          className={`status ${String(ticket.status).toLowerCase()} pill-status`} 
                          value={ticket.status} 
                          onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                          style={{ border: 'none', appearance: 'none', cursor: 'pointer', paddingRight: '20px' }}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                        <span style={{marginLeft: '-15px', pointerEvents: 'none', fontSize: '0.7rem'}}>▼</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-secondary small-btn"
                          disabled={!ticket.attachments || ticket.attachments.length === 0}
                          onClick={() => setAttachmentModal({
                            open: true,
                            ticketId: ticket.id,
                            attachments: ticket.attachments || [],
                            index: 0
                          })}
                        >
                          {ticket.attachments?.length || 0} files
                        </button>
                      </td>
                      <td>{new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-secondary small-btn ghost"
                            onClick={() => openCommentModal(ticket)}
                          >
                            Comments
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {ticketError && <div className="error-banner" style={{marginTop: '16px'}}>{ticketError}</div>}
        </section>

        <section id="notifications" className="admin-panel-box glass-panel-soft">
          <div className="panel-top">
            <div>
              <h2>Notifications</h2>
              <p>Track updates on ticket status changes and new comments[cite: 46].</p>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="empty-state custom-empty glass-empty">
              <span className="empty-icon">🔔</span>
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="alert-list">
              {notifications.map((note, index) => <div key={index} className="alert-item">{note}</div>)}
            </div>
          )}
        </section>
      </main>

      {/* Modals for Evidence and Comments [cite: 40, 43] */}
      {attachmentModal.open && (
        <div className="modal-overlay" onClick={() => setAttachmentModal({ open: false, ticketId: '', attachments: [], index: 0 })}>
          <div className="modal-content popup-anim evidence-modal-full" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" type="button" onClick={() => setAttachmentModal({ open: false, ticketId: '', attachments: [], index: 0 })}>&times;</button>
            <h2 style={{marginTop: 0}}>Ticket Evidence</h2>
            <div className="evidence-viewer">
              <button type="button" className="btn-secondary" disabled={attachmentModal.index <= 0} onClick={() => setAttachmentModal(prev => ({ ...prev, index: prev.index - 1 }))}>Prev</button>
              <div className="evidence-frame">
                <img src={attachmentModal.attachments[attachmentModal.index]} alt="Evidence" />
                <div className="evidence-count">{attachmentModal.index + 1} / {attachmentModal.attachments.length}</div>
              </div>
              <button type="button" className="btn-secondary" disabled={attachmentModal.index >= attachmentModal.attachments.length - 1} onClick={() => setAttachmentModal(prev => ({ ...prev, index: prev.index + 1 }))}>Next</button>
            </div>
          </div>
        </div>
      )}

      {commentModal.open && (
        <IncidentCommentsModal
          ticketId={commentModal.ticketId}
          ticketLabel={commentModal.ticketLabel}
          currentEmail={currentEmail}
          currentRole={currentRole}
          onClose={() => setCommentModal({ open: false, ticketId: '', ticketLabel: '' })}
        />
      )}
    </div>
  )
}