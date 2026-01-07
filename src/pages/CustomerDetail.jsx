import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, Plus, Edit2, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'

function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)

  useEffect(() => {
    fetchCustomer()
  }, [id])

  const fetchCustomer = () => {
    fetch(`/api/customers/${id}`)
      .then(res => res.json())
      .then(data => {
        setCustomer(data)
        setLoading(false)
      })
  }

  const handleSaveAddress = (formData) => {
    const url = editingAddress
      ? `/api/addresses/${editingAddress.id}`
      : `/api/customers/${id}/addresses`
    const method = editingAddress ? 'PUT' : 'POST'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, customer_id: parseInt(id) })
    })
      .then(() => {
        fetchCustomer()
        setShowAddressModal(false)
        setEditingAddress(null)
      })
  }

  const handleDeleteAddress = (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    fetch(`/api/addresses/${addressId}`, { method: 'DELETE' })
      .then(() => fetchCustomer())
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!customer) {
    return <div className="text-center py-8">Customer not found</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/customers" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">{customer.phone}</a>
                </div>
              )}
              {customer.mobile && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${customer.mobile}`} className="text-blue-600 hover:underline">{customer.mobile} (mobile)</a>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">{customer.email}</a>
                </div>
              )}
            </div>
            {customer.notes && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-lg shadow p-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Addresses</h2>
              <button
                onClick={() => { setEditingAddress(null); setShowAddressModal(true) }}
                className="flex items-center gap-1 text-sm text-unbloc-600 hover:text-unbloc-700"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {customer.addresses?.length === 0 ? (
              <p className="text-gray-500 text-sm">No addresses yet</p>
            ) : (
              <div className="space-y-3">
                {customer.addresses?.map(address => (
                  <div key={address.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-800">{address.address_line1}</p>
                        {address.address_line2 && <p className="text-gray-600 text-sm">{address.address_line2}</p>}
                        <p className="text-gray-600 text-sm">
                          {[address.city, address.county, address.postcode].filter(Boolean).join(', ')}
                        </p>
                        {address.is_primary === 1 && (
                          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Primary</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingAddress(address); setShowAddressModal(true) }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Jobs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Jobs</h2>
              <Link
                to={`/jobs?customer=${id}`}
                className="flex items-center gap-1 text-sm bg-unbloc-600 text-white px-3 py-1.5 rounded-lg hover:bg-unbloc-700"
              >
                <Plus className="w-4 h-4" />
                New Job
              </Link>
            </div>
            <div className="p-4">
              {customer.jobs?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No jobs yet for this customer</p>
              ) : (
                <div className="space-y-3">
                  {customer.jobs?.map(job => (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">{job.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                            {job.scheduled_date && <span>{job.scheduled_date}</span>}
                            {job.engineer_name && <span>{job.engineer_name}</span>}
                            {job.postcode && <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">{job.postcode}</span>}
                          </div>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <AddressModal
          address={editingAddress}
          onClose={() => { setShowAddressModal(false); setEditingAddress(null) }}
          onSave={handleSaveAddress}
        />
      )}
    </div>
  )
}

function AddressModal({ address, onClose, onSave }) {
  const [formData, setFormData] = useState({
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    county: address?.county || '',
    postcode: address?.postcode || '',
    is_primary: address?.is_primary || false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Modal title={address ? 'Edit Address' : 'Add Address'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
          <input
            type="text"
            required
            value={formData.address_line1}
            onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
          <input
            type="text"
            value={formData.address_line2}
            onChange={e => setFormData({ ...formData, address_line2: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
            <input
              type="text"
              value={formData.county}
              onChange={e => setFormData({ ...formData, county: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
          <input
            type="text"
            value={formData.postcode}
            onChange={e => setFormData({ ...formData, postcode: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_primary"
            checked={formData.is_primary}
            onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
            className="rounded border-gray-300"
          />
          <label htmlFor="is_primary" className="text-sm text-gray-700">Set as primary address</label>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-unbloc-600 text-white rounded-lg hover:bg-unbloc-700">
            {address ? 'Save Changes' : 'Add Address'}
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

export default CustomerDetail
