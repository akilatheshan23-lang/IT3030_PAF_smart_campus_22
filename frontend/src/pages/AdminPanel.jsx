import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import campusApi from '../api/campusApi'

const initialResourceForm = {
  name: '',
  type: 'Lecture Hall',
  capacity: '',
  location: '',
  startTime: '08:00',
  endTime: '18:00',
  status: 'ACTIVE'
}

export default function AdminPanel() {
  const [summary, setSummary] = useState(null)
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [error, setError] = useState('')
  const [resourceListError, setResourceListError] = useState('')
  const [isLoadingResources, setIsLoadingResources] = useState(false)
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [resourceForm, setResourceForm] = useState(initialResourceForm)
  const [resourceErrors, setResourceErrors] = useState({})
  const [resourceSubmitError, setResourceSubmitError] = useState('')
  const [resourceSubmitSuccess, setResourceSubmitSuccess] = useState('')
  const [isCreatingResource, setIsCreatingResource] = useState(false)
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

  useEffect(() => {
    loadSummary()
    loadBookings()
    loadResources()
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

  const openResourceModal = () => {
    setResourceForm(initialResourceForm)
    setResourceErrors({})
    setResourceSubmitError('')
    setIsResourceModalOpen(true)
  }

  const closeResourceModal = () => {
    if (isCreatingResource) {
      return
    }
    setIsResourceModalOpen(false)
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

  const handleCreateResource = async (event) => {
    event.preventDefault()

    if (!validateResourceForm()) {
      return
    }

    setResourceSubmitError('')
    setResourceSubmitSuccess('')
    setIsCreatingResource(true)

    const payload = {
      name: resourceForm.name.trim(),
      type: resourceForm.type.trim(),
      capacity: Number(resourceForm.capacity),
      location: resourceForm.location.trim(),
      availabilityWindow: `${resourceForm.startTime} - ${resourceForm.endTime}`,
      status: resourceForm.status
    }

    try {
      await campusApi.post('/admin/resources', payload)
      setIsResourceModalOpen(false)
      setResourceForm(initialResourceForm)
      setResourceErrors({})
      setResourceSubmitSuccess(`Resource "${payload.name}" added successfully.`)
      await loadSummary()
      await loadResources(resourceFilters)
    } catch (err) {
      setResourceSubmitError(err?.response?.data?.message || 'Failed to create resource.')
    } finally {
      setIsCreatingResource(false)
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
        <a href="#resources">Assets</a>
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
          <button className="btn-primary" type="button" onClick={openResourceModal}>+ Add New Resource</button>
        </section>

        {resourceSubmitSuccess && <p className="success-text">{resourceSubmitSuccess}</p>}

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
              <option value="Lecture Hall">Lecture Hall</option>
              <option value="Projector">Projector</option>
              <option value="Lab">Lab</option>
              <option value="Meeting Room">Meeting Room</option>
              <option value="Equipment">Equipment</option>
              <option value="Other">Other</option>
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
                </tr>
              </thead>
              <tbody>
                {isLoadingResources ? (
                  <tr>
                    <td colSpan="7" className="empty-state">Loading assets...</td>
                  </tr>
                ) : resources.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">No assets found.</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
            <h2 id="resource-modal-title">Add New Resource</h2>
            <button className="close-btn" type="button" onClick={closeResourceModal} aria-label="Close add resource form">&times;</button>
            <p className="resource-modal-subtitle">Create lecture halls, projectors, labs, and other university facilities.</p>

            {resourceSubmitError && <div className="error-banner">{resourceSubmitError}</div>}

            <form onSubmit={handleCreateResource} className="booking-form resource-form">
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
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Projector">Projector</option>
                    <option value="Lab">Lab</option>
                    <option value="Meeting Room">Meeting Room</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
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
                <button type="button" className="btn-secondary" onClick={closeResourceModal} disabled={isCreatingResource}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isCreatingResource}>
                  {isCreatingResource ? 'Creating...' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
