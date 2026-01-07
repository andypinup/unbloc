import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Phone, Mail, MapPin, Briefcase } from 'lucide-react'
import Modal from '../components/Modal'

function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data)
        setLoading(false)
      })
  }

  const handleSave = (formData) => {
    const url = editingCustomer
      ? `/api/customers/${editingCustomer.id}`
      : '/api/customers'
    const method = editingCustomer ? 'PUT' : 'POST'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        fetchCustomers()
        setShowModal(false)
        setEditingCustomer(null)
      })
  }

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    fetch(`/api/customers/${id}`, { method: 'DELETE' })
      .then(() => fetchCustomers())
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <button
          onClick={() => { setEditingCustomer(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-unbloc-600 text-white px-4 py-2 rounded-lg hover:bg-unbloc-700"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 focus:border-unbloc-500"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {customers.length === 0 ? 'No customers yet. Add your first customer!' : 'No customers match your search.'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link to={`/customers/${customer.id}`} className="text-lg font-medium text-gray-800 hover:text-unbloc-600">
                      {customer.name}
                    </Link>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {customer.address_count} address{customer.address_count !== 1 ? 'es' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {customer.job_count} job{customer.job_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingCustomer(customer); setShowModal(true) }}
                      className="text-gray-600 hover:text-unbloc-600 px-3 py-1 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-gray-600 hover:text-red-600 px-3 py-1 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => { setShowModal(false); setEditingCustomer(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function CustomerModal({ customer, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    mobile: customer?.mobile || '',
    notes: customer?.notes || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Modal title={customer ? 'Edit Customer' : 'Add Customer'} onClose={onClose}>
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
        <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            />
          </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-unbloc-600 text-white rounded-lg hover:bg-unbloc-700">
            {customer ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default Customers
