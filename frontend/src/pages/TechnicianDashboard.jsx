import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'

export default function TechnicianDashboard() {
  const [profile, setProfile] = useState({ email: '', name: '' })
  const [authLoading, setAuthLoading] = useState(true)
  const [assignedTickets, setAssignedTickets] = useState([])
  const navigate = useNavigate()

  const notifications = []

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
        await loadTickets()
      } catch (err) {
        navigate('/login')
      } finally {
        setAuthLoading(false)
      }
    }

    initialize()
  }, [])

  const loadTickets = async () => {
    try {
      const response = await campusApi.get('/technician/tickets')
      setAssignedTickets(response.data)
    } catch (err) {
      console.error('Failed to load tickets', err)
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await campusApi.put(`/technician/tickets/${id}/status`, null, {
        params: { status: newStatus }
      })
      loadTickets()
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

  if (authLoading) {
    return null
  }

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
              <span className="eyebrow">Module C</span>
              <h2>Maintenance & Incident Tickets</h2>
              <p>Monitor tickets assigned to you and update their status with resolution notes.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Resource</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Last Update</th>
                </tr>
              </thead>
              <tbody>
                {assignedTickets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No tickets assigned or open.</td>
                  </tr>
                ) : (
                  assignedTickets.map(ticket => (
                    <tr key={ticket.id} className="table-row-hover">
                      <td className="font-mono"><strong>{ticket.ticketCode}</strong><br/><span style={{fontSize: '0.85rem', color: 'var(--muted)'}}>{ticket.category}</span></td>
                      <td>{ticket.resourceId || ticket.location}</td>
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
                      <td>{new Date(ticket.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="notifications" className="admin-panel-box glass-panel-soft">
          <div className="panel-top">
            <div>
              <span className="eyebrow">Module D</span>
              <h2>Notifications</h2>
              <p>Track updates on ticket status changes and new comments.</p>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-state custom-empty glass-empty">
              <span className="empty-icon">🔔</span>
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="alert-list">
              {notifications.map((note, index) => (
                <div key={index} className="alert-item">
                  {note}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
