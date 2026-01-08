import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, User, Send, Trash2, Edit2, Tag, MessageSquare, Briefcase } from 'lucide-react'
import Modal from '../components/Modal'

function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [senderName, setSenderName] = useState('Support Team')
  const [senderType, setSenderType] = useState('staff')
  const [showEditModal, setShowEditModal] = useState(false)
  const [engineers, setEngineers] = useState([])
  const [customers, setCustomers] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchTicket()
    Promise.all([
      fetch('/api/engineers').then(res => res.json()),
      fetch('/api/customers').then(res => res.json())
    ]).then(([engineersData, customersData]) => {
      setEngineers(engineersData)
      setCustomers(customersData)
    })
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const fetchTicket = () => {
    fetch(`/api/tickets/${id}`)
      .then(res => res.json())
      .then(data => {
        setTicket(data)
        setLoading(false)
      })
  }

  const handleStatusChange = (status) => {
    fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ticket, status })
    }).then(() => fetchTicket())
  }

  const handleAddMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    fetch(`/api/tickets/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: newMessage,
        sender_name: senderName,
        sender_type: senderType
      })
    }).then(() => {
      setNewMessage('')
      fetchTicket()
    })
  }

  const handleDeleteMessage = (messageId) => {
    if (!confirm('Delete this message?')) return
    fetch(`/api/ticket-messages/${messageId}`, { method: 'DELETE' })
      .then(() => fetchTicket())
  }

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this ticket?')) return
    fetch(`/api/tickets/${id}`, { method: 'DELETE' })
      .then(() => navigate('/tickets'))
  }

  const handleUpdate = (formData) => {
    fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(() => {
      setShowEditModal(false)
      fetchTicket()
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!ticket) {
    return <div className="text-center py-8">Ticket not found</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/tickets" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">#{ticket.id}</span>
              <h1 className="text-2xl font-bold text-gray-800">{ticket.title}</h1>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <TicketStatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Tag className="w-4 h-4" />
                {ticket.category || 'Support'}
              </span>
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
          {ticket.description && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Issue Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {/* Status Actions */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h2>
            <div className="flex flex-wrap gap-2">
              {['open', 'in_progress', 'resolved', 'closed'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    ticket.status === status
                      ? 'bg-unbloc-600 text-white border-unbloc-600'
                      : 'border-gray-300 hover:border-unbloc-400'
                  }`}
                >
                  {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-800">Conversation</h2>
              <span className="text-sm text-gray-500">({ticket.messages?.length || 0} messages)</span>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {ticket.messages?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No messages yet. Start the conversation below.</p>
              ) : (
                <div className="space-y-4">
                  {ticket.messages?.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.sender_type === 'customer'
                          ? 'bg-blue-50 ml-0 mr-8'
                          : 'bg-gray-50 ml-8 mr-0'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                            msg.sender_type === 'customer' ? 'bg-blue-500' : 'bg-unbloc-600'
                          }`}>
                            {msg.sender_name?.[0]?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">{msg.sender_name || 'Support'}</span>
                            <span className={`text-xs ml-2 px-2 py-0.5 rounded ${
                              msg.sender_type === 'customer'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {msg.sender_type === 'customer' ? 'Customer' : 'Staff'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* New Message Form */}
            <div className="p-4 border-t bg-gray-50">
              <form onSubmit={handleAddMessage} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    placeholder="Your name"
                    className="w-40 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 text-sm"
                  />
                  <select
                    value={senderType}
                    onChange={e => setSenderType(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 text-sm"
                  >
                    <option value="staff">Staff</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 resize-none"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-unbloc-600 text-white rounded-lg hover:bg-unbloc-700 self-end"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Ticket Info */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ticket Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-800">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-800">{new Date(ticket.updated_at).toLocaleDateString()}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolved</span>
                  <span className="text-gray-800">{new Date(ticket.resolved_at).toLocaleDateString()}</span>
                </div>
              )}
              {ticket.engineer_name && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Assigned To</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ticket.engineer_color || '#3b82f6' }}
                    />
                    <span className="text-gray-800">{ticket.engineer_name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer</h2>
            <Link to={`/customers/${ticket.customer_id}`} className="text-unbloc-600 hover:underline font-medium">
              {ticket.customer_name}
            </Link>
            <div className="mt-3 space-y-2">
              {ticket.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${ticket.customer_phone}`} className="text-blue-600 hover:underline">
                    {ticket.customer_phone}
                  </a>
                </div>
              )}
              {ticket.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${ticket.customer_email}`} className="text-blue-600 hover:underline">
                    {ticket.customer_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Related Job */}
          {ticket.job_id && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Related Job</h2>
              <Link
                to={`/jobs/${ticket.job_id}`}
                className="flex items-center gap-2 text-unbloc-600 hover:underline"
              >
                <Briefcase className="w-4 h-4" />
                {ticket.job_title || `Job #${ticket.job_id}`}
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to={`/jobs?customer=${ticket.customer_id}`}
                className="block w-full px-4 py-2 text-center border rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Create Job from Ticket
              </Link>
              <Link
                to={`/customers/${ticket.customer_id}`}
                className="block w-full px-4 py-2 text-center border rounded-lg hover:bg-gray-50 text-gray-700"
              >
                View Customer Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditTicketModal
          ticket={ticket}
          engineers={engineers}
          customers={customers}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdate}
        />
      )}
    </div>
  )
}

function EditTicketModal({ ticket, engineers, customers, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customer_id: ticket.customer_id,
    title: ticket.title,
    description: ticket.description || '',
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category || 'support',
    assigned_engineer_id: ticket.assigned_engineer_id || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      customer_id: parseInt(formData.customer_id),
      assigned_engineer_id: formData.assigned_engineer_id ? parseInt(formData.assigned_engineer_id) : null
    })
  }

  return (
    <Modal title="Edit Ticket" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <select
            value={formData.customer_id}
            onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            >
              <option value="support">Support</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="complaint">Complaint</option>
              <option value="inquiry">Inquiry</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <select
              value={formData.assigned_engineer_id}
              onChange={e => setFormData({ ...formData, assigned_engineer_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            >
              <option value="">Unassigned</option>
              {engineers.filter(e => e.active).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
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

function TicketStatusBadge({ status }) {
  const styles = {
    open: 'bg-red-100 text-red-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-green-100 text-green-700'
  }

  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed'
  }

  return (
    <span className={`text-xs px-2 py-1 rounded ${styles[status] || styles.open}`}>
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

export default TicketDetail
