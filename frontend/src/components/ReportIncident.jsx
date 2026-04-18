import { useEffect, useState } from 'react'
import campusApi from '../api/campusApi'

export default function ReportIncident({ onSuccess, defaultResourceId, onClose }) {
  const [resourceId, setResourceId] = useState('')
  const [resources, setResources] = useState([])
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await campusApi.get('/resources/public')
        setResources(res.data || [])
      } catch (err) {
        // ignore
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (defaultResourceId) setResourceId(defaultResourceId)
  }, [defaultResourceId])

  const canSubmit = description.trim() !== '' && category.trim() !== ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const payload = {
        resourceId: resourceId || null,
        category,
        description,
        priority
      }
      await campusApi.post('/incidents', payload)
      setSuccess('Incident reported successfully')
      if (onSuccess) onSuccess()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      const resp = err.response?.data || {}
      const msg = resp.message || resp.error || resp.reason || err.message || 'Failed to report incident'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2>Report an Incident</h2>
      <button className="close-btn" onClick={() => onClose && onClose()}>&times;</button>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-text">{success}</div>}

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label>Resource</label>
          {resources.length > 0 ? (
            <select value={resourceId} onChange={e => setResourceId(e.target.value)}>
              <option value="">-- Choose resource --</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.location})</option>
              ))}
            </select>
          ) : (
            <input type="text" value={resourceId} onChange={e => setResourceId(e.target.value)} placeholder="Resource ID (optional)" />
          )}
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value)} required>
            <option value="">-- Select category --</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="HVAC">HVAC</option>
            <option value="Furniture">Furniture</option>
            <option value="Network">Network</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" required placeholder="Describe the issue in detail" />
        </div>

        <button type="submit" className="btn-primary full-width modal-submit" disabled={!canSubmit || loading}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </>
  )
}
