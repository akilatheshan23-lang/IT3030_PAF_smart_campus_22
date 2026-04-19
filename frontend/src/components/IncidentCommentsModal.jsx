import { useEffect, useState } from 'react'
import campusApi from '../api/campusApi'

const formatTimestamp = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default function IncidentCommentsModal({
  ticketId,
  ticketLabel,
  onClose,
  currentEmail,
  currentRole
}) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [editingBody, setEditingBody] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const isAdmin = currentRole === 'ADMIN'
  const normalizedEmail = currentEmail ? currentEmail.toLowerCase() : ''

  useEffect(() => {
    if (!ticketId) return
    loadComments()
  }, [ticketId])

  const loadComments = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await campusApi.get(`/incidents/${ticketId}/comments`)
      setComments(response.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load comments.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    const body = draft.trim()
    if (!body) return

    setSaving(true)
    setError('')
    try {
      const response = await campusApi.post(`/incidents/${ticketId}/comments`, { body })
      setComments(response.data || [])
      setDraft('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add comment.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (comment) => {
    setEditingId(comment.id)
    setEditingBody(comment.body || '')
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditingBody('')
  }

  const handleUpdate = async (commentId) => {
    const body = editingBody.trim()
    if (!body) return

    setSaving(true)
    setError('')
    try {
      const response = await campusApi.put(`/incidents/${ticketId}/comments/${commentId}`, { body })
      setComments(response.data || [])
      cancelEdit()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update comment.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (commentId) => {
    const confirmed = window.confirm('Delete this comment?')
    if (!confirmed) return

    setDeletingId(commentId)
    setError('')
    try {
      const response = await campusApi.delete(`/incidents/${ticketId}/comments/${commentId}`)
      setComments(response.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete comment.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content popup-anim comments-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-btn" type="button" onClick={onClose}>
          &times;
        </button>
        <h2 style={{ marginTop: 0 }}>Ticket Comments</h2>
        {ticketLabel && <p className="text-muted" style={{ marginTop: '-6px' }}>{ticketLabel}</p>}

        <div className="comment-compose">
          <textarea
            rows="3"
            placeholder="Add a comment..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={1000}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={!draft.trim() || saving}
            onClick={handleAddComment}
          >
            {saving ? 'Posting...' : 'Post Comment'}
          </button>
        </div>

        {error && <div className="error-banner" style={{ marginTop: '12px' }}>{error}</div>}

        {loading ? (
          <div className="empty-state" style={{ marginTop: '16px' }}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '16px' }}>No comments yet.</div>
        ) : (
          <div className="comment-list">
            {comments.map((comment) => {
              const isOwner = normalizedEmail && comment.authorEmail && comment.authorEmail.toLowerCase() === normalizedEmail
              const canEdit = isOwner
              const canDelete = isOwner || isAdmin

              return (
                <div className="comment-card" key={comment.id}>
                  <div className="comment-meta">
                    <div>
                      <strong>{comment.authorName || comment.authorEmail || 'Unknown'}</strong>
                      {comment.authorRole && (
                        <span className="comment-role">{comment.authorRole}</span>
                      )}
                    </div>
                    <div className="comment-time">
                      {formatTimestamp(comment.createdAt)}
                      {comment.updatedAt && <span className="comment-edited">(edited)</span>}
                    </div>
                  </div>

                  {editingId === comment.id ? (
                    <div className="comment-edit">
                      <textarea
                        rows="3"
                        value={editingBody}
                        onChange={(event) => setEditingBody(event.target.value)}
                        maxLength={1000}
                      />
                      <div className="comment-actions">
                        <button
                          type="button"
                          className="btn-secondary small-btn"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-primary small-btn"
                          onClick={() => handleUpdate(comment.id)}
                          disabled={!editingBody.trim() || saving}
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="comment-body">{comment.body}</p>
                      {(canEdit || canDelete) && (
                        <div className="comment-actions">
                          {canEdit && (
                            <button
                              type="button"
                              className="btn-secondary small-btn"
                              onClick={() => startEdit(comment)}
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="btn-danger small-btn"
                              onClick={() => handleDelete(comment.id)}
                              disabled={deletingId === comment.id}
                            >
                              {deletingId === comment.id ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
