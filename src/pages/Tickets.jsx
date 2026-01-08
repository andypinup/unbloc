import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, Filter, MessageSquare, User, Tag } from 'lucide-react'
import Modal from '../components/Modal'

function Tickets() {
  const [searchParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [customers, setCustomers] = useState([])
  const [engineers, setEngineers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)

  const preselectedCustomerId = searchParams.get('customer')

  useEffect(() => {
    Promise.all([
      fetch('/api/tickets').then(res => res.json()),
      fetch('/api/customers').then(res => res.json()),
      fetch('/api/engineers').then(res => res.json())
    ]).then(([ticketsData, customersData, engineersData]) => {
      setTickets(ticketsData)
      setCustomers(customersData)
      setEngineers(engineersData)
      setLoading(false)

      if (preselectedCustomerId) {
        setShowModal(true)
      }
    })
  }, [])

  const fetchTickets = () => {
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)
    if (priorityFilter) params.append('priority', priorityFilter)
    if (categoryFilter) params.append('category', categoryFilter)

    const url = `/api/tickets${params.toString() ? '?' + params.toString() : ''}`
    fetch(url)
      .then(res => res.json())
      .then(setTickets)
  }

  useEffect(() => {
    if (!loading) fetchTickets()
  }, [statusFilter, priorityFilter, categoryFilter])

  const handleSave = (formData) => {
    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(() => {
        fetchTickets()
        setShowModal(false)
      })
  }

  const filteredTickets = tickets.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-unbloc-600 text-white px-4 py-2 rounded-lg hover:bg-unbloc-700"
        >
          <Plus className="w-5 h-5" />
          New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          >
            <option value="">All Categories</option>
            <option value="support">Support</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="complaint">Complaint</option>
            <option value="inquiry">Inquiry</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {tickets.length === 0 ? 'No tickets yet. Create your first ticket!' : 'No tickets match your filters.'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredTickets.map(ticket => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="block p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm">#{ticket.id}</span>
                      <h3 className="font-medium text-gray-800">{ticket.title}</h3>
                      <TicketStatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="text-gray-600 mt-1">{ticket.customer_name}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {ticket.category || 'Support'}
                      </span>
                      {ticket.message_count > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {ticket.message_count} message{ticket.message_count !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-gray-400">
                        Created {formatDate(ticket.created_at)}
                      </span>
                    </div>
                  </div>
                  {ticket.engineer_name && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ticket.engineer_color || '#3b82f6' }}
                      />
                      <span className="text-sm text-gray-600">{ticket.engineer_name}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {showModal && (
        <TicketModal
          customers={customers}
          engineers={engineers}
          preselectedCustomerId={preselectedCustomerId}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function TicketModal({ customers, engineers, preselectedCustomerId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customer_id: preselectedCustomerId || '',
    title: '',
    description: '',
    priority: 'normal',
    category: 'support',
    assigned_engineer_id: ''
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
    <Modal title="New Support Ticket" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          <select
            required
            value={formData.customer_id}
            onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          >
            <option value="">Select customer...</option>
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
            placeholder="Brief description of the issue"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of the customer's issue..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
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
            Create Ticket
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

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

export default Tickets
