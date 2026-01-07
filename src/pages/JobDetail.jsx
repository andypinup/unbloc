import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, Clock, Calendar, User, Send, Trash2, Edit2 } from 'lucide-react'
import Modal from '../components/Modal'

function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [engineers, setEngineers] = useState([])
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    fetchJob()
    fetch('/api/engineers').then(res => res.json()).then(setEngineers)
  }, [id])

  const fetchJob = () => {
    fetch(`/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => {
        setJob(data)
        setLoading(false)
        if (data.customer_id) {
          fetch(`/api/customers/${data.customer_id}/addresses`)
            .then(res => res.json())
            .then(setAddresses)
        }
      })
  }

  const handleStatusChange = (status) => {
    fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...job, status })
    }).then(() => fetchJob())
  }

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!newNote.trim()) return

    fetch(`/api/jobs/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote })
    }).then(() => {
      setNewNote('')
      fetchJob()
    })
  }

  const handleDeleteNote = (noteId) => {
    if (!confirm('Delete this note?')) return
    fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      .then(() => fetchJob())
  }

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this job?')) return
    fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      .then(() => navigate('/jobs'))
  }

  const handleUpdate = (formData) => {
    fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(() => {
      setShowEditModal(false)
      fetchJob()
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!job) {
    return <div className="text-center py-8">Job not found</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/jobs" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{job.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={job.status} />
              <PriorityBadge priority={job.priority} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {job.description && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {/* Status Actions */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h2>
            <div className="flex flex-wrap gap-2">
              {['pending', 'in_progress', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    job.status === status
                      ? 'bg-unbloc-600 text-white border-unbloc-600'
                      : 'border-gray-300 hover:border-unbloc-400'
                  }`}
                >
                  {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Job Notes</h2>
            </div>
            <div className="p-4">
              <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-unbloc-600 text-white rounded-lg hover:bg-unbloc-700"
                >
                  <Send className="w-4 h-4" />
                  Add
                </button>
              </form>

              {job.notes?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {job.notes?.map(note => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="text-gray-800">{note.note}</p>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Schedule */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Schedule</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">
                  {job.scheduled_date || 'Not scheduled'}
                </span>
              </div>
              {job.scheduled_time && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-800">{job.scheduled_time}</span>
                  <span className="text-sm text-gray-500">({job.duration_minutes} mins)</span>
                </div>
              )}
              {job.engineer_name && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-800">{job.engineer_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer</h2>
            <Link to={`/customers/${job.customer_id}`} className="text-unbloc-600 hover:underline font-medium">
              {job.customer_name}
            </Link>
            <div className="mt-3 space-y-2">
              {job.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${job.customer_phone}`} className="text-blue-600 hover:underline">
                    {job.customer_phone}
                  </a>
                </div>
              )}
              {job.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${job.customer_email}`} className="text-blue-600 hover:underline">
                    {job.customer_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          {job.address_line1 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Job Address</h2>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-gray-800">
                  <p>{job.address_line1}</p>
                  {job.address_line2 && <p>{job.address_line2}</p>}
                  <p>{[job.city, job.county, job.postcode].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditJobModal
          job={job}
          engineers={engineers}
          addresses={addresses}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdate}
        />
      )}
    </div>
  )
}

function EditJobModal({ job, engineers, addresses, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customer_id: job.customer_id,
    address_id: job.address_id || '',
    engineer_id: job.engineer_id || '',
    title: job.title,
    description: job.description || '',
    status: job.status,
    priority: job.priority,
    scheduled_date: job.scheduled_date || '',
    scheduled_time: job.scheduled_time || '',
    duration_minutes: job.duration_minutes || 60
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      address_id: formData.address_id ? parseInt(formData.address_id) : null,
      engineer_id: formData.engineer_id ? parseInt(formData.engineer_id) : null,
      duration_minutes: parseInt(formData.duration_minutes)
    })
  }

  return (
    <Modal title="Edit Job" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <select
              value={formData.address_id}
              onChange={e => setFormData({ ...formData, address_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            >
              <option value="">Select address...</option>
              {addresses.map(a => (
                <option key={a.id} value={a.id}>
                  {a.address_line1}, {a.postcode}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Engineer</label>
            <select
              value={formData.engineer_id}
              onChange={e => setFormData({ ...formData, engineer_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            >
              <option value="">Unassigned</option>
              {engineers.filter(e => e.active).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.scheduled_date}
              onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={formData.scheduled_time}
              onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <select
              value={formData.duration_minutes}
              onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            >
              <option value="30">30 mins</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
              <option value="240">4 hours</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-unbloc-600 text-white rounded-lg hover:bg-unbloc-700">
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }

  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }

  return (
    <span className={`text-xs px-2 py-1 rounded ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  )
}

function PriorityBadge({ priority }) {
  if (!priority || priority === 'normal') return null

  const styles = {
    low: 'bg-gray-100 text-gray-600',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  }

  return (
    <span className={`text-xs px-2 py-1 rounded ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

export default JobDetail
