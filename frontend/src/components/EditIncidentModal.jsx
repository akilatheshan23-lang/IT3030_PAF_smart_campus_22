import { useEffect, useMemo, useState } from 'react'
import campusApi from '../api/campusApi'

export default function EditIncidentModal({ ticket, resources, onClose, onSaved }) {
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState([])
  const [attachmentError, setAttachmentError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const MAX_ATTACHMENTS = 3
  const MAX_FILE_BYTES = 1500000
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  const resourceName = useMemo(() => {
    const res = resources.find(r => r.id === ticket?.resourceId)
    return res ? res.name : ticket?.resourceId
  }, [resources, ticket?.resourceId])

  useEffect(() => {
    if (!ticket) return
    setCategory(ticket.category || '')
    setPriority(ticket.priority || 'MEDIUM')
    setDescription(ticket.description || '')
    const existing = (ticket.attachments || []).map((dataUrl, index) => ({
      name: `attachment-${index + 1}`,
      dataUrl
    }))
    setAttachments(existing)
    setAttachmentError('')
    setError('')
    setSuccess('')
  }, [ticket])

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, dataUrl: String(reader.result) })
    reader.onerror = () => reject(new Error('read-failed'))
    reader.readAsDataURL(file)
  })

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setAttachmentError('')
    const remaining = MAX_ATTACHMENTS - attachments.length
    if (remaining <= 0) {
      setAttachmentError('You can attach up to 3 images.')
      e.target.value = ''
      return
    }

    const nextFiles = files.slice(0, remaining)
    const newItems = []

    for (const file of nextFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setAttachmentError('Only JPG, PNG, WEBP, or GIF images are allowed.')
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        setAttachmentError('Each image must be 1.5MB or smaller.')
        continue
      }

      try {
        const result = await fileToDataUrl(file)
        newItems.push(result)
      } catch (err) {
        setAttachmentError('Failed to read one of the selected files.')
      }
    }

    if (files.length > remaining) {
      setAttachmentError('Only 3 images can be attached.')
    }

    if (newItems.length) {
      setAttachments(prev => [...prev, ...newItems].slice(0, MAX_ATTACHMENTS))
    }

    e.target.value = ''
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const canSubmit = category.trim() !== '' && description.trim() !== ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ticket?.id || !canSubmit) return
    setLoading(true)
    setError('')
    try {
      const payload = {
        category,
        description,
        priority,
        attachments: attachments.map(item => item.dataUrl)
      }
      await campusApi.put(`/incidents/${ticket.id}`, payload)
      setSuccess('Ticket updated successfully')
      if (onSaved) onSaved()
      setTimeout(() => setSuccess(''), 1500)
    } catch (err) {
      const resp = err.response?.data || {}
      const msg = resp.message || resp.error || resp.reason || err.message || 'Failed to update ticket'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!ticket) return null

  return (
    <div className="modal-overlay" onClick={() => onClose && onClose()}>
      <div className="modal-content popup-anim" onClick={(event) => event.stopPropagation()}>
        <h2>Edit Ticket</h2>
        <button className="close-btn" onClick={() => onClose && onClose()}>&times;</button>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-text">{success}</div>}

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label>Resource</label>
            <input type="text" value={resourceName || ''} disabled />
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
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" required />
          </div>

          <div className="form-group">
            <label>Evidence (up to 3 images)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={attachments.length >= MAX_ATTACHMENTS}
            />
            <p className="attachment-hint">JPG, PNG, WEBP, or GIF. Max 1.5MB each.</p>
            {attachmentError && <div className="helper-error">{attachmentError}</div>}

            {attachments.length > 0 && (
              <div className="attachment-grid">
                {attachments.map((item, index) => (
                  <div className="attachment-card" key={`${item.name}-${index}`}>
                    <img src={item.dataUrl} alt={`Attachment ${index + 1}`} />
                    <button
                      type="button"
                      className="attachment-remove"
                      onClick={() => removeAttachment(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary full-width modal-submit" disabled={!canSubmit || loading}>
            {loading ? 'Updating...' : 'Update Ticket'}
          </button>
        </form>
      </div>
    </div>
  )
}
