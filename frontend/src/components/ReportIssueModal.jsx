import { useState } from 'react'

export default function ReportIssueModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    resourceId: '',
    location: '',
    category: 'PLUMBING',
    priority: 'LOW',
    description: ''
  })
  
  const [useResource, setUseResource] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Clear out the unused field
    const submitData = { ...formData }
    if (useResource) {
      submitData.location = ''
    } else {
      submitData.resourceId = ''
    }
    
    onSubmit(submitData)
  }

  return (
    <div className="modal-overlay popup-anim">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Report an Issue</h2>
        <p className="text-muted" style={{ marginBottom: '24px' }}>Maintenance or incident ticketing system.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          
          <div className="form-toggle" style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
            <label style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="radio" checked={!useResource} onChange={() => setUseResource(false)} style={{ marginRight: '6px' }} />
              General Location
            </label>
            <label style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="radio" checked={useResource} onChange={() => setUseResource(true)} style={{ marginRight: '6px' }} />
              Specific Resource
            </label>
          </div>

          <div className="form-group">
            <label>{useResource ? 'Resource ID' : 'Location'}</label>
            {useResource ? (
              <input
                type="text"
                name="resourceId"
                placeholder="e.g. REC-102"
                value={formData.resourceId}
                onChange={handleChange}
                required={useResource}
                className="input-field"
              />
            ) : (
              <input
                type="text"
                name="location"
                placeholder="e.g. North Wing Hallway"
                value={formData.location}
                onChange={handleChange}
                required={!useResource}
                className="input-field"
              />
            )}
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="input-field" required>
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="IT">IT & Connectivity</option>
                <option value="CLEANING">Cleaning</option>
                <option value="GENERAL">General Maintenance</option>
              </select>
            </div>
            <div>
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="input-field" required>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              rows="4"
              placeholder="Describe the incident or maintenance required..."
              value={formData.description}
              onChange={handleChange}
              required
              className="input-field"
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>

          <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button type="button" className="btn-secondary full-width" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary full-width">Submit Ticket</button>
          </div>
        </form>
      </div>
    </div>
  )
}
