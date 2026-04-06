import { useState } from 'react'
import campusApi from '../api/campusApi'

export default function BookingModal({ onClose, onSuccess, resources, userEmail, userName }) {
  const [formData, setFormData] = useState({
    resourceId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendeeCount: 1
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const resourceName = resources.find(r => r.id === formData.resourceId)?.name || 'Unknown'

      const payload = {
        requesterName: userName,
        requesterEmail: userEmail,
        resourceId: formData.resourceId,
        resourceName,
        ...formData
      }

      await campusApi.post('/user/bookings', payload)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit booking.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel popup-anim">
        <h2>Book a Resource</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label>Select Resource</label>
            <select name="resourceId" value={formData.resourceId} onChange={handleChange} required>
              <option value="">-- Choose a resource --</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time (HH:MM)</label>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>End Time (HH:MM)</label>
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Expected Attendees</label>
            <input type="number" name="attendeeCount" value={formData.attendeeCount} onChange={handleChange} min="1" required />
          </div>

          <div className="form-group">
            <label>Purpose</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              placeholder="Why do you need this resource?"
              rows="3"
            />
          </div>

          <button type="submit" className="btn-primary full-width modal-submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}