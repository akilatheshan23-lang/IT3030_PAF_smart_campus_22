import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'
import IncidentCommentsModal from '../components/IncidentCommentsModal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  LogOut,
  LayoutDashboard,
  CalendarCheck,
  AlertTriangle,
  Search,
  Calendar,
  ChevronDown,
  ClipboardList
} from 'lucide-react'

const initialResourceForm = {
  name: '',
  type: 'Lecture Hall',
  capacity: '',
  location: '',
  startTime: '08:00',
  endTime: '18:00',
  status: 'ACTIVE'
}

const resourceTypes = ['Lecture Hall', 'Projector', 'Lab', 'Meeting Room', 'Equipment', 'Other']

const parseAvailabilityWindow = (availabilityWindow) => {
  const [startRaw = '', endRaw = ''] = String(availabilityWindow || '').split('-').map((part) => part.trim())
  const isValidStart = /^\d{2}:\d{2}$/.test(startRaw)
  const isValidEnd = /^\d{2}:\d{2}$/.test(endRaw)

  return {
    startTime: isValidStart ? startRaw : initialResourceForm.startTime,
    endTime: isValidEnd ? endRaw : initialResourceForm.endTime
  }
}

const formatAMPM = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const paddedH = h < 10 ? `0${h}` : h;
  return `${paddedH}:${parts[1]} ${ampm}`;
};

export default function AdminPanel() {
  const [summary, setSummary] = useState(null)
  const [bookings, setBookings] = useState([])
  const [tickets, setTickets] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [ticketAssignments, setTicketAssignments] = useState({})
  const [ticketError, setTicketError] = useState('')
  const [assigningTicketId, setAssigningTicketId] = useState('')
  const [rejectingTicketId, setRejectingTicketId] = useState('')
  const [closingTicketId, setClosingTicketId] = useState('')
  const [attachmentModal, setAttachmentModal] = useState({ open: false, ticketId: '', attachments: [], index: 0 })
  const [commentModal, setCommentModal] = useState({ open: false, ticketId: '', ticketLabel: '' })
  const [resources, setResources] = useState([])
  const [error, setError] = useState('')
  const [resourceListError, setResourceListError] = useState('')
  const [isLoadingResources, setIsLoadingResources] = useState(false)
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [resourceForm, setResourceForm] = useState(initialResourceForm)
  const [resourceErrors, setResourceErrors] = useState({})
  const [resourceSubmitError, setResourceSubmitError] = useState('')
  const [resourceSubmitSuccess, setResourceSubmitSuccess] = useState('')
  const [isSubmittingResource, setIsSubmittingResource] = useState(false)
  const [resourceModalMode, setResourceModalMode] = useState('create')
  const [editingResourceId, setEditingResourceId] = useState('')
  const [resourceStatusUpdateId, setResourceStatusUpdateId] = useState('')
  const [resourceDeleteId, setResourceDeleteId] = useState('')
  const [resourceFilters, setResourceFilters] = useState({
    name: '',
    type: '',
    status: '',
    minCapacity: ''
  })
  const [filters, setFilters] = useState({
    status: '',
    resource: '',
    date: ''
  })
  const navigate = useNavigate()
  const currentEmail = localStorage.getItem('smart-campus-user-email') || ''
  const currentRole = localStorage.getItem('smart-campus-role') || 'ADMIN'

  useEffect(() => {
    loadSummary()
    loadBookings()
    loadResources()
    loadTickets()
    loadTechnicians()

    const summaryRefreshInterval = window.setInterval(() => {
      loadSummary()
    }, 15000)

    return () => window.clearInterval(summaryRefreshInterval)
  }, [])

  useEffect(() => {
    if (!isResourceModalOpen) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsResourceModalOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isResourceModalOpen])

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

  const loadResources = async (customFilters = resourceFilters) => {
    try {
      setIsLoadingResources(true)
      setResourceListError('')

      const params = {}
      if (customFilters.name) params.name = customFilters.name
      if (customFilters.type) params.type = customFilters.type
      if (customFilters.status) params.status = customFilters.status
      if (customFilters.minCapacity) params.minCapacity = customFilters.minCapacity

      const response = await campusApi.get('/admin/resources', { params })
      setResources(response.data)
    } catch (err) {
      setResourceListError(err?.response?.data?.message || 'Failed to load resources.')
    } finally {
      setIsLoadingResources(false)
    }
  }

  const loadTickets = async () => {
    try {
      setTicketError('')
      const response = await campusApi.get('/admin/tickets')
      const data = response.data || []
      setTickets(data)
      const nextAssignments = {}
      data.forEach(ticket => {
        nextAssignments[ticket.id] = ticket.assignedTechnicianId || ''
      })
      setTicketAssignments(nextAssignments)
    } catch (err) {
      setTicketError(err?.response?.data?.message || 'Failed to load tickets.')
    }
  }

  const loadTechnicians = async () => {
    try {
      const response = await campusApi.get('/admin/technicians')
      setTechnicians(response.data || [])
    } catch (err) {
      setTechnicians([])
    }
  }

  const getResourceName = (resourceId) => {
    const r = resources.find(res => res.id === resourceId)
    return r ? r.name : resourceId
  }

  const openCommentModal = (ticket) => {
    if (!ticket?.id) return
    setCommentModal({
      open: true,
      ticketId: ticket.id,
      ticketLabel: getResourceName(ticket.resourceId)
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

  const handleResourceFilterChange = (event) => {
    const nextFilters = {
      ...resourceFilters,
      [event.target.name]: event.target.value
    }
    setResourceFilters(nextFilters)
  }

  const handleTicketAssignmentChange = (ticketId, value) => {
    setTicketAssignments(prev => ({
      ...prev,
      [ticketId]: value
    }))
  }

  const handleAssignTicket = async (ticketId) => {
    const technicianId = ticketAssignments[ticketId]
    if (!technicianId) {
      window.alert('Select a technician before assigning.')
      return
    }

    setAssigningTicketId(ticketId)
    setTicketError('')
    try {
      await campusApi.put(`/admin/tickets/${ticketId}/assign`, { technicianId })
      await loadTickets()
    } catch (err) {
      setTicketError(err?.response?.data?.message || 'Failed to assign ticket.')
    } finally {
      setAssigningTicketId('')
    }
  }

  const handleRejectTicket = async (ticketId) => {
    const reason = window.prompt('Enter a reason for rejecting this ticket:')
    if (!reason || !reason.trim()) {
      window.alert('Rejection reason is required.')
      return
    }

    setRejectingTicketId(ticketId)
    setTicketError('')
    try {
      await campusApi.put(`/admin/tickets/${ticketId}/reject`, { reason })
      await loadTickets()
    } catch (err) {
      setTicketError(err?.response?.data?.message || 'Failed to reject ticket.')
    } finally {
      setRejectingTicketId('')
    }
  }

  const handleCloseTicket = async (ticketId) => {
    const confirmed = window.confirm('Close this ticket?')
    if (!confirmed) return

    setClosingTicketId(ticketId)
    setTicketError('')
    try {
      await campusApi.put(`/admin/tickets/${ticketId}/close`)
      await loadTickets()
    } catch (err) {
      setTicketError(err?.response?.data?.message || 'Failed to close ticket.')
    } finally {
      setClosingTicketId('')
    }
  }

  const handleResourceFilterSubmit = (event) => {
    event.preventDefault()
    loadResources(resourceFilters)
  }

  const handleResourceFilterReset = () => {
    const resetFilters = {
      name: '',
      type: '',
      status: '',
      minCapacity: ''
    }
    setResourceFilters(resetFilters)
    loadResources(resetFilters)
  }

  const openCreateResourceModal = () => {
    setResourceModalMode('create')
    setEditingResourceId('')
    setResourceForm(initialResourceForm)
    setResourceErrors({})
    setResourceSubmitError('')
    setResourceSubmitSuccess('')
    setIsResourceModalOpen(true)
  }

  const openEditResourceModal = (resource) => {
    const { startTime, endTime } = parseAvailabilityWindow(resource.availabilityWindow)

    setResourceModalMode('edit')
    setEditingResourceId(resource.id || '')
    setResourceForm({
      name: resource.name || '',
      type: resource.type || initialResourceForm.type,
      capacity: String(resource.capacity ?? ''),
      location: resource.location || '',
      startTime,
      endTime,
      status: resource.status || initialResourceForm.status
    })
    setResourceErrors({})
    setResourceSubmitError('')
    setResourceSubmitSuccess('')
    setIsResourceModalOpen(true)
  }

  const closeResourceModal = () => {
    if (isSubmittingResource) {
      return
    }

    setIsResourceModalOpen(false)
    setResourceModalMode('create')
    setEditingResourceId('')
    setResourceForm(initialResourceForm)
    setResourceErrors({})
    setResourceSubmitError('')
  }

  const handleResourceInputChange = (event) => {
    const { name, value } = event.target

    setResourceForm((previous) => ({
      ...previous,
      [name]: value
    }))

    setResourceErrors((previous) => {
      if (!previous[name]) {
        return previous
      }
      const next = { ...previous }
      delete next[name]
      return next
    })

    if (resourceSubmitError) {
      setResourceSubmitError('')
    }
  }

  const validateResourceForm = () => {
    const nextErrors = {}
    const normalizedName = resourceForm.name.trim()
    const normalizedType = resourceForm.type.trim()
    const normalizedLocation = resourceForm.location.trim()
    const capacityValue = Number(resourceForm.capacity)

    if (!normalizedName) {
      nextErrors.name = 'Resource name is required.'
    } else if (normalizedName.length > 120) {
      nextErrors.name = 'Resource name must be at most 120 characters.'
    }

    if (!normalizedType) {
      nextErrors.type = 'Resource type is required.'
    } else if (normalizedType.length > 80) {
      nextErrors.type = 'Resource type must be at most 80 characters.'
    }

    if (!normalizedLocation) {
      nextErrors.location = 'Location is required.'
    } else if (normalizedLocation.length > 120) {
      nextErrors.location = 'Location must be at most 120 characters.'
    }

    if (!resourceForm.capacity) {
      nextErrors.capacity = 'Capacity is required.'
    } else if (!Number.isInteger(capacityValue) || capacityValue <= 0) {
      nextErrors.capacity = 'Capacity must be a positive whole number.'
    }

    if (!resourceForm.startTime) {
      nextErrors.startTime = 'Start time is required.'
    }

    if (!resourceForm.endTime) {
      nextErrors.endTime = 'End time is required.'
    }

    if (resourceForm.startTime && resourceForm.endTime && resourceForm.startTime >= resourceForm.endTime) {
      nextErrors.endTime = 'End time must be later than start time.'
    }

    if (!['ACTIVE', 'OUT_OF_SERVICE'].includes(resourceForm.status)) {
      nextErrors.status = 'Select a valid resource status.'
    }

    setResourceErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleResourceSubmit = async (event) => {
    event.preventDefault()

    if (!validateResourceForm()) {
      return
    }

    if (resourceModalMode === 'edit' && !editingResourceId) {
      setResourceSubmitError('Unable to update resource. Missing resource ID.')
      return
    }

    setResourceSubmitError('')
    setResourceSubmitSuccess('')
    setIsSubmittingResource(true)

    const payload = {
      name: resourceForm.name.trim(),
      type: resourceForm.type.trim(),
      capacity: Number(resourceForm.capacity),
      location: resourceForm.location.trim(),
      availabilityWindow: `${resourceForm.startTime} - ${resourceForm.endTime}`,
      status: resourceForm.status
    }

    try {
      if (resourceModalMode === 'edit') {
        await campusApi.put(`/admin/resources/${editingResourceId}`, payload)
      } else {
        await campusApi.post('/admin/resources', payload)
      }

      setIsResourceModalOpen(false)
      setResourceModalMode('create')
      setEditingResourceId('')
      setResourceForm(initialResourceForm)
      setResourceErrors({})
      setResourceSubmitSuccess(
        resourceModalMode === 'edit'
          ? `Resource "${payload.name}" updated successfully.`
          : `Resource "${payload.name}" added successfully.`
      )
      await loadSummary()
      await loadResources(resourceFilters)
    } catch (err) {
      setResourceSubmitError(
        err?.response?.data?.message
          || (resourceModalMode === 'edit' ? 'Failed to update resource.' : 'Failed to create resource.')
      )
    } finally {
      setIsSubmittingResource(false)
    }
  }

  const handleQuickResourceStatusUpdate = async (resource, targetStatus) => {
    if (!resource?.id) {
      return
    }

    if (resource.status === targetStatus) {
      return
    }

    setResourceStatusUpdateId(resource.id)
    setResourceListError('')
    setResourceSubmitError('')

    try {
      await campusApi.patch(`/admin/resources/${resource.id}`, { status: targetStatus })

      const statusLabel = targetStatus === 'OUT_OF_SERVICE' ? 'OUT_OF_SERVICE' : 'ACTIVE'
      setResourceSubmitSuccess(`Resource "${resource.name}" is now ${statusLabel}.`)
      await loadSummary()
      await loadResources(resourceFilters)
    } catch (err) {
      setResourceListError(err?.response?.data?.message || 'Failed to update resource status.')
    } finally {
      setResourceStatusUpdateId('')
    }
  }

  const handleDeleteResource = async (resource) => {
    if (!resource?.id) {
      return
    }

    const confirmed = window.confirm(
      `Delete resource "${resource.name}"? This action cannot be undone.`
    )
    if (!confirmed) {
      return
    }

    setResourceDeleteId(resource.id)
    setResourceListError('')
    setResourceSubmitError('')

    try {
      await campusApi.delete(`/admin/resources/${resource.id}`)
      setResourceSubmitSuccess(`Resource "${resource.name}" deleted successfully.`)
      await loadSummary()
      await loadResources(resourceFilters)
    } catch (err) {
      setResourceListError(err?.response?.data?.message || 'Failed to delete resource.')
    } finally {
      setResourceDeleteId('')
    }
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

  const downloadBookingsPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.setTextColor(30, 27, 75) // #1e1b4b
    doc.text('Smart Campus', 14, 22)
    
    doc.setFontSize(14)
    doc.setTextColor(109, 40, 217) // #6d28d9
    doc.text('Booking Management Report', 14, 30)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 38)

    const tableColumn = ["Code", "Requester", "Resource", "Date", "Time", "Status"]
    const tableRows = []

    bookings.forEach(booking => {
      const bookingData = [
        booking.bookingCode || '-',
        `${booking.requesterName}\n(${booking.requesterEmail})`,
        booking.resourceName || '-',
        booking.bookingDate || '-',
        `${formatAMPM(booking.startTime)} - ${formatAMPM(booking.endTime)}`,
        booking.status || '-'
      ]
      tableRows.push(bookingData)
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 32 },
        5: { cellWidth: 22 },
      }
    })

    doc.save('booking_management_report.pdf')
  }

  const totalResourceCount = Number(summary?.totalResources ?? 0)
  const activeResourceCount = Number(summary?.activeResources ?? 0)
  const outOfServiceResourceCount = Number(summary?.outOfServiceResources ?? 0)
  const inventoryTotal = totalResourceCount > 0
    ? totalResourceCount
    : activeResourceCount + outOfServiceResourceCount
  const activeResourcePercent = inventoryTotal > 0
    ? Math.round((activeResourceCount / inventoryTotal) * 100)
    : 0
  const outOfServiceResourcePercent = inventoryTotal > 0
    ? Math.round((outOfServiceResourceCount / inventoryTotal) * 100)
    : 0

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
           <a href="#resources" className="nav-item">
             <Search size={20} /> Assets
           </a>
           <a href="#bookings" className="nav-item">
             <CalendarCheck size={20} /> Booking Review
           </a>
           <a href="#tickets" className="nav-item">
             <ClipboardList size={20} /> Tickets
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
<button 
            className="btn-primary" 
            type="button" 
            onClick={openCreateResourceModal}
            style={{background: 'linear-gradient(135deg, #a78bfa, #6d28d9)', boxShadow: '0 10px 25px rgba(109, 40, 217, 0.3)'}}
          >
            + Add New Resource
          </button>
        </section>

        <section id="tickets" className="admin-panel-box user-section glass-panel-soft" style={{padding: '32px'}}>
          <div className="panel-top" style={{marginBottom: '20px'}}>
            <div>
              <span className="eyebrow" style={{color: '#0ea5e9'}}>Incident Tickets</span>
              <h2 style={{color: '#0f172a', fontSize: '1.6rem', marginTop: '4px'}}>Assign tickets to technicians</h2>
              <p>Review all tickets raised by users and route each issue to an available technician.</p>
            </div>
          </div>

          {ticketError && (
            <div className="error-banner" style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px'}}>
              <AlertTriangle size={18}/> {ticketError}
            </div>
          )}

          <div className="table-wrap">
            <table className="booking-table modern-table">
              <thead>
                <tr>
                  <th className="table-header-custom">Ticket</th>
                  <th className="table-header-custom">Category</th>
                  <th className="table-header-custom">Priority</th>
                  <th className="table-header-custom">Status</th>
                  <th className="table-header-custom">Evidence</th>
                  <th className="table-header-custom">Comments</th>
                  <th className="table-header-custom">Created</th>
                  <th className="table-header-custom">Assigned</th>
                  <th className="table-header-custom">Assign</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <div className="custom-empty" style={{textAlign: 'center', margin: '32px 0'}}>
                        <ClipboardList size={42} style={{color: '#cbd5e1', marginBottom: '12px'}}/>
                        <div style={{color: '#64748b'}}>No tickets found.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map(ticket => (
                    <tr key={ticket.id} className="table-row-hover">
                      <td className="small-text font-mono">{getResourceName(ticket.resourceId)}</td>
                      <td>{ticket.category}</td>
                      <td>{ticket.priority}</td>
                      <td>
                        <span className={`status-badge ${String(ticket.status).toLowerCase()}`}>
                          {formatTicketStatus(ticket.status)}
                        </span>
                        {ticket.rejectionReason && (
                          <span className="reason-tooltip premium-tooltip" title={ticket.rejectionReason}> ℹ️</span>
                        )}
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
                      <td>
                        <button
                          type="button"
                          className="btn-secondary small-btn"
                          onClick={() => openCommentModal(ticket)}
                        >
                          Comments
                        </button>
                      </td>
                      <td>{ticket.createdAt}</td>
                      <td>
                        {ticket.assignedTechnicianName
                          ? `${ticket.assignedTechnicianName} (${ticket.assignedTechnicianEmail})`
                          : 'Unassigned'}
                      </td>
                      <td>
                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                          <select
                            value={ticketAssignments[ticket.id] || ''}
                            onChange={(event) => handleTicketAssignmentChange(ticket.id, event.target.value)}
                            disabled={['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status)}
                          >
                            <option value="">Select technician</option>
                            {technicians.map(tech => (
                              <option key={tech.id} value={tech.id}>
                                {tech.name || tech.email}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn-primary small-btn"
                            disabled={assigningTicketId === ticket.id || ['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status)}
                            onClick={() => handleAssignTicket(ticket.id)}
                          >
                            {assigningTicketId === ticket.id ? 'Assigning...' : 'Assign'}
                          </button>
                        </div>
                        <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                          {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
                            <button
                              type="button"
                              className="btn-danger small-btn ghost-danger"
                              disabled={rejectingTicketId === ticket.id}
                              onClick={() => handleRejectTicket(ticket.id)}
                            >
                              {rejectingTicketId === ticket.id ? 'Rejecting...' : 'Reject'}
                            </button>
                          )}
                          {ticket.status === 'RESOLVED' && (
                            <button
                              type="button"
                              className="btn-secondary small-btn"
                              disabled={closingTicketId === ticket.id}
                              onClick={() => handleCloseTicket(ticket.id)}
                            >
                              {closingTicketId === ticket.id ? 'Closing...' : 'Close'}
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

        {resourceSubmitSuccess && <p className="success-text">{resourceSubmitSuccess}</p>}

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

        <section className="admin-panel-box inventory-dashboard">
          <div className="panel-top inventory-panel-top">
            <div>
              <span className="eyebrow">Inventory Dashboard</span>
              <h2>Asset status overview</h2>
              <p>Visual breakdown of how many assets are ACTIVE vs OUT_OF_SERVICE.</p>
            </div>
          </div>

          <div className="inventory-layout">
            <article className="inventory-tile active-tile">
              <div className="inventory-title-row">
                <h3>ACTIVE</h3>
                <span className="inventory-pill">{activeResourcePercent}%</span>
              </div>
              <p className="inventory-count">{activeResourceCount}</p>
              <div className="inventory-progress" aria-label="Active asset ratio">
                <span style={{ width: `${activeResourcePercent}%` }} />
              </div>
            </article>

            <article className="inventory-tile out-of-service-tile">
              <div className="inventory-title-row">
                <h3>OUT_OF_SERVICE</h3>
                <span className="inventory-pill">{outOfServiceResourcePercent}%</span>
              </div>
              <p className="inventory-count">{outOfServiceResourceCount}</p>
              <div className="inventory-progress" aria-label="Out of service asset ratio">
                <span style={{ width: `${outOfServiceResourcePercent}%` }} />
              </div>
            </article>

            <article className="inventory-total-card">
              <p>Total Assets</p>
              <h3>{inventoryTotal}</h3>
              <small>Live inventory health snapshot</small>
            </article>
          </div>
        </section>

        


        <section id="resources" className="admin-panel-box">
          <div className="panel-top">
            <div>
              <span className="eyebrow">Asset Registry</span>
              <h2>Detailed resource inventory</h2>
              <p>View all assets with metadata including capacity, location, availability windows, and status.</p>
            </div>
          </div>

          <form className="filter-bar resource-filter" onSubmit={handleResourceFilterSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Search by asset name"
              value={resourceFilters.name}
              onChange={handleResourceFilterChange}
            />

            <select name="type" value={resourceFilters.type} onChange={handleResourceFilterChange}>
              <option value="">All Types</option>
              {resourceTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select name="status" value={resourceFilters.status} onChange={handleResourceFilterChange}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="OUT_OF_SERVICE">Out of service</option>
            </select>

            <input
              type="number"
              min="1"
              step="1"
              name="minCapacity"
              placeholder="Min capacity"
              value={resourceFilters.minCapacity}
              onChange={handleResourceFilterChange}
            />

            <div className="resource-filter-actions">
              <button type="submit" className="btn-primary">Apply</button>
              <button type="button" className="btn-secondary" onClick={handleResourceFilterReset}>Reset</button>
            </div>
          </form>

          {resourceListError && <p className="error-text">{resourceListError}</p>}

          <div className="table-wrap">
            <table className="booking-table asset-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Availability</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingResources ? (
                  <tr>
                    <td colSpan="8" className="empty-state">Loading assets...</td>
                  </tr>
                ) : resources.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">No assets found.</td>
                  </tr>
                ) : (
                  resources.map((resource) => (
                    <tr key={resource.id} className="table-row-hover">
                      <td className="small-text font-mono">{resource.id}</td>
                      <td>{resource.name || '-'}</td>
                      <td>{resource.type || '-'}</td>
                      <td>{resource.capacity ?? '-'}</td>
                      <td>{resource.location || '-'}</td>
                      <td>{resource.availabilityWindow || '-'}</td>
                      <td>
                        <span className={`status ${String(resource.status).toLowerCase()}`}>
                          {resource.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons resource-actions">
                          <button
                            className="btn-secondary small-btn"
                            type="button"
                            onClick={() => openEditResourceModal(resource)}
                            disabled={resourceStatusUpdateId === resource.id || resourceDeleteId === resource.id}
                          >
                            Edit
                          </button>

                          {resource.status === 'OUT_OF_SERVICE' ? (
                            <button
                              className="btn-success small-btn"
                              type="button"
                              onClick={() => handleQuickResourceStatusUpdate(resource, 'ACTIVE')}
                              disabled={resourceStatusUpdateId === resource.id || resourceDeleteId === resource.id}
                            >
                              {resourceStatusUpdateId === resource.id ? 'Updating...' : 'Mark Active'}
                            </button>
                          ) : (
                            <button
                              className="btn-warning small-btn"
                              type="button"
                              onClick={() => handleQuickResourceStatusUpdate(resource, 'OUT_OF_SERVICE')}
                              disabled={resourceStatusUpdateId === resource.id || resourceDeleteId === resource.id}
                            >
                              {resourceStatusUpdateId === resource.id ? 'Updating...' : 'Mark Out of Service'}
                            </button>
                          )}

                          <button
                            className="btn-danger small-btn"
                            type="button"
                            onClick={() => handleDeleteResource(resource)}
                            disabled={resourceStatusUpdateId === resource.id || resourceDeleteId === resource.id}
                          >
                            {resourceDeleteId === resource.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

            <div style={{display: 'flex', gap: '12px'}}>
              <button type="submit" className="btn-primary apply-btn" style={{background: '#3b82f6', whiteSpace: 'nowrap'}}>Apply Filters</button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={downloadBookingsPDF}
                style={{display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'}}
              >
                <ClipboardList size={18} /> Download PDF
              </button>
            </div>
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
                      <td style={{color: '#475569'}}>{formatAMPM(booking.startTime)} - {formatAMPM(booking.endTime)}</td>
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

      {attachmentModal.open && (
        <div className="modal-overlay" onClick={() => setAttachmentModal({ open: false, ticketId: '', attachments: [], index: 0 })}>
          <div className="modal-content popup-anim evidence-modal-full" onClick={(event) => event.stopPropagation()}>
            <button className="close-btn" type="button" onClick={() => setAttachmentModal({ open: false, ticketId: '', attachments: [], index: 0 })}>
              &times;
            </button>
            <h2 style={{marginTop: 0}}>Ticket Evidence</h2>
            {attachmentModal.attachments.length === 0 ? (
              <p className="text-muted">No attachments for this ticket.</p>
            ) : (
              <div className="evidence-viewer">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={attachmentModal.index <= 0}
                  onClick={() => setAttachmentModal(prev => ({ ...prev, index: Math.max(0, prev.index - 1) }))}
                >
                  Prev
                </button>
                <div className="evidence-frame">
                  <img
                    src={attachmentModal.attachments[attachmentModal.index]}
                    alt={`Attachment ${attachmentModal.index + 1}`}
                  />
                  <div className="evidence-count">
                    {attachmentModal.index + 1} / {attachmentModal.attachments.length}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={attachmentModal.index >= attachmentModal.attachments.length - 1}
                  onClick={() => setAttachmentModal(prev => ({ ...prev, index: Math.min(prev.attachments.length - 1, prev.index + 1) }))}
                >
                  Next
                </button>
              </div>
            )}
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

      {isResourceModalOpen && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeResourceModal()
            }
          }}
        >
          <div className="modal-content glass-panel popup-anim resource-modal" role="dialog" aria-modal="true" aria-labelledby="resource-modal-title">
            <h2 id="resource-modal-title">{resourceModalMode === 'edit' ? 'Edit Resource' : 'Add New Resource'}</h2>
            <button
              className="close-btn"
              type="button"
              onClick={closeResourceModal}
              aria-label={resourceModalMode === 'edit' ? 'Close edit resource form' : 'Close add resource form'}
            >
              &times;
            </button>
            <p className="resource-modal-subtitle">
              {resourceModalMode === 'edit'
                ? 'Modify asset details or mark it out of service during maintenance.'
                : 'Create lecture halls, projectors, labs, and other university facilities.'}
            </p>

            {resourceSubmitError && <div className="error-banner">{resourceSubmitError}</div>}

            <form onSubmit={handleResourceSubmit} className="booking-form resource-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="resourceName">Resource Name</label>
                  <input
                    id="resourceName"
                    type="text"
                    name="name"
                    placeholder="Main Lecture Hall A"
                    value={resourceForm.name}
                    onChange={handleResourceInputChange}
                    className={resourceErrors.name ? 'input-error' : ''}
                    maxLength={120}
                  />
                  {resourceErrors.name && <span className="field-error">{resourceErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="resourceType">Type</label>
                  <select
                    id="resourceType"
                    name="type"
                    value={resourceForm.type}
                    onChange={handleResourceInputChange}
                    className={resourceErrors.type ? 'input-error' : ''}
                  >
                    {resourceTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {resourceErrors.type && <span className="field-error">{resourceErrors.type}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="resourceCapacity">Capacity</label>
                  <input
                    id="resourceCapacity"
                    type="number"
                    name="capacity"
                    min="1"
                    step="1"
                    placeholder="100"
                    value={resourceForm.capacity}
                    onChange={handleResourceInputChange}
                    className={resourceErrors.capacity ? 'input-error' : ''}
                  />
                  {resourceErrors.capacity && <span className="field-error">{resourceErrors.capacity}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="resourceStatus">Status</label>
                  <select
                    id="resourceStatus"
                    name="status"
                    value={resourceForm.status}
                    onChange={handleResourceInputChange}
                    className={resourceErrors.status ? 'input-error' : ''}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="OUT_OF_SERVICE">Out of service</option>
                  </select>
                  {resourceErrors.status && <span className="field-error">{resourceErrors.status}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="resourceLocation">Location</label>
                <input
                  id="resourceLocation"
                  type="text"
                  name="location"
                  placeholder="Block A"
                  value={resourceForm.location}
                  onChange={handleResourceInputChange}
                  className={resourceErrors.location ? 'input-error' : ''}
                  maxLength={120}
                />
                {resourceErrors.location && <span className="field-error">{resourceErrors.location}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="resourceStartTime">Available From (HH:MM)</label>
                  <input
                    id="resourceStartTime"
                    type="time"
                    name="startTime"
                    value={resourceForm.startTime}
                    onChange={handleResourceInputChange}
                    className={resourceErrors.startTime ? 'input-error' : ''}
                  />
                  {resourceErrors.startTime && <span className="field-error">{resourceErrors.startTime}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="resourceEndTime">Available To (HH:MM)</label>
                  <input
                    id="resourceEndTime"
                    type="time"
                    name="endTime"
                    value={resourceForm.endTime}
                    onChange={handleResourceInputChange}
                    className={resourceErrors.endTime ? 'input-error' : ''}
                  />
                  {resourceErrors.endTime && <span className="field-error">{resourceErrors.endTime}</span>}
                </div>
              </div>

              <div className="resource-form-actions">
                <button type="button" className="btn-secondary" onClick={closeResourceModal} disabled={isSubmittingResource}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmittingResource}>
                  {isSubmittingResource
                    ? (resourceModalMode === 'edit' ? 'Saving...' : 'Creating...')
                    : (resourceModalMode === 'edit' ? 'Save Changes' : 'Create Resource')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
