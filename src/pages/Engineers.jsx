import { useState, useEffect } from 'react'
import { Plus, Phone, Mail, Edit2, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

function Engineers() {
  const [engineers, setEngineers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEngineer, setEditingEngineer] = useState(null)

  useEffect(() => {
    fetchEngineers()
  }, [])

  const fetchEngineers = () => {
    fetch('/api/engineers')
      .then(res => res.json())
      .then(data => {
        setEngineers(data)
        setLoading(false)
      })
  }

  const handleSave = (formData) => {
    const url = editingEngineer
      ? `/api/engineers/${editingEngineer.id}`
      : '/api/engineers'
    const method = editingEngineer ? 'PUT' : 'POST'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(() => {
        fetchEngineers()
        setShowModal(false)
        setEditingEngineer(null)
      })
  }

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this engineer?')) return
    fetch(`/api/engineers/${id}`, { method: 'DELETE' })
      .then(() => fetchEngineers())
  }

  const handleToggleActive = (engineer) => {
    fetch(`/api/engineers/${engineer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...engineer, active: engineer.active ? 0 : 1 })
    }).then(() => fetchEngineers())
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Engineers</h1>
        <button
          onClick={() => { setEditingEngineer(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-unbloc-600 text-white px-4 py-2 rounded-lg hover:bg-unbloc-700"
        >
          <Plus className="w-5 h-5" />
          Add Engineer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {engineers.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No engineers yet. Add your first engineer!
          </div>
        ) : (
          engineers.map(engineer => (
            <div key={engineer.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: engineer.color || '#3b82f6' }}
                  >
                    {engineer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{engineer.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      engineer.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {engineer.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingEngineer(engineer); setShowModal(true) }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(engineer.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {engineer.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${engineer.phone}`} className="hover:text-blue-600">{engineer.phone}</a>
                  </div>
                )}
                {engineer.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${engineer.email}`} className="hover:text-blue-600">{engineer.email}</a>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => handleToggleActive(engineer)}
                  className={`w-full py-2 rounded-lg text-sm ${
                    engineer.active
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {engineer.active ? 'Mark Inactive' : 'Mark Active'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <EngineerModal
          engineer={editingEngineer}
          onClose={() => { setShowModal(false); setEditingEngineer(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function EngineerModal({ engineer, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: engineer?.name || '',
    email: engineer?.email || '',
    phone: engineer?.phone || '',
    color: engineer?.color || COLORS[0],
    active: engineer?.active ?? 1
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Modal title={engineer ? 'Edit Engineer' : 'Add Engineer'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Calendar Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color ? 'border-gray-800' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-unbloc-600 text-white rounded-lg hover:bg-unbloc-700">
            {engineer ? 'Save Changes' : 'Add Engineer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default Engineers
