import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'

export default function TechnicianDashboard() {
  const [profile, setProfile] = useState({ email: '', name: '' })
  const [authLoading, setAuthLoading] = useState(true)
  const navigate = useNavigate()

  const assignedTickets = []
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
      } catch (err) {
        navigate('/login')
      } finally {
        setAuthLoading(false)
      }
    }

    initialize()
  }, [])

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
                    <td colSpan="5" className="empty-state">No tickets assigned yet.</td>
                  </tr>
                ) : (
                  assignedTickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>{ticket.code}</td>
                      <td>{ticket.resource}</td>
                      <td>{ticket.priority}</td>
                      <td>{ticket.status}</td>
                      <td>{ticket.updatedAt}</td>
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
