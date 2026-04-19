import { useState } from 'react'
import campusApi from '../api/campusApi'
import { CheckCircle } from 'lucide-react'

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
  const [isSuccess, setIsSuccess] = useState(false)

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
      if (!userEmail) {
        setError('Please sign in before submitting a booking request.')
        return
      }
      const resourceName = resources.find(r => r.id === formData.resourceId)?.name || 'Unknown'

      const payload = {
        requesterName: userName,
        requesterEmail: userEmail,
        resourceId: formData.resourceId,
        resourceName,
        ...formData
      }

      await campusApi.post('/user/bookings', payload)
      setIsSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit booking.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel popup-anim" style={isSuccess ? { maxWidth: '400px' } : {}}>
        {isSuccess ? (
          <div className="success-state-container" style={{ textAlign: 'center', padding: '30px 10px', animation: 'fadeIn 0.5s ease-out' }}>
            <div className="success-icon-wrapper" style={{ 
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', 
              borderRadius: '50%', 
              width: '80px', 
              height: '80px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px auto',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle size={40} color="#059669" strokeWidth={2.5} />
            </div>
            <h2 style={{ color: '#064e3b', fontSize: '1.6rem', marginBottom: '12px' }}>Request Submitted!</h2>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '28px' }}>
              Your booking has been forwarded to the administration. You can track the approval status directly from your dashboard.
            </p>
            <button 
              className="btn-primary full-width modal-submit" 
              onClick={onSuccess}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)' }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}