import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, Filter, Calendar, Clock, MapPin } from 'lucide-react'
import Modal from '../components/Modal'

function Jobs() {
  const [searchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [customers, setCustomers] = useState([])
  const [engineers, setEngineers] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)

  const preselectedCustomerId = searchParams.get('customer')

  useEffect(() => {
    Promise.all([
      fetch('/api/jobs').then(res => res.json()),
      fetch('/api/customers').then(res => res.json()),
      fetch('/api/engineers').then(res => res.json())
    ]).then(([jobsData, customersData, engineersData]) => {
      setJobs(jobsData)
      setCustomers(customersData)
      setEngineers(engineersData)
      setLoading(false)

      if (preselectedCustomerId) {
        setShowModal(true)
      }
    })
  }, [])

  const fetchJobs = () => {
    let url = '/api/jobs'
    if (statusFilter) {
      url += `?status=${statusFilter}`
    }
    fetch(url)
      .then(res => res.json())
      .then(setJobs)
  }

  useEffect(() => {
    if (!loading) fetchJobs()
  }, [statusFilter])

  const handleSave = (formData) => {
    fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(() => {
        fetchJobs()
        setShowModal(false)
      })
  }

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    j.postcode?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Jobs</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-unbloc-600 text-white px-4 py-2 rounded-lg hover:bg-unbloc-700"
        >
          <Plus className="w-5 h-5" />
          New Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
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
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow">
        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {jobs.length === 0 ? 'No jobs yet. Create your first job!' : 'No jobs match your filters.'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredJobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="block p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-800">{job.title}</h3>
                      <StatusBadge status={job.status} />
                      <PriorityBadge priority={job.priority} />
                    </div>
                    <p className="text-gray-600 mt-1">{job.customer_name}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      {job.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {job.scheduled_date}
                        </span>
                      )}
                      {job.scheduled_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.scheduled_time}
                        </span>
                      )}
                      {job.postcode && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.postcode}
                        </span>
                      )}
                      {job.note_count > 0 && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {job.note_count} note{job.note_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {job.engineer_name && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: job.engineer_color || '#3b82f6' }}
                      />
                      <span className="text-sm text-gray-600">{job.engineer_name}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Job Modal */}
      {showModal && (
        <JobModal
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

function JobModal({ customers, engineers, preselectedCustomerId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customer_id: preselectedCustomerId || '',
    address_id: '',
    engineer_id: '',
    title: '',
    description: '',
    priority: 'normal',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60
  })
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    if (formData.customer_id) {
      fetch(`/api/customers/${formData.customer_id}/addresses`)
        .then(res => res.json())
        .then(data => {
          setAddresses(data)
          if (data.length > 0) {
            const primary = data.find(a => a.is_primary) || data[0]
            setFormData(prev => ({ ...prev, address_id: primary.id.toString() }))
          }
        })
    }
  }, [formData.customer_id])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      customer_id: parseInt(formData.customer_id),
      address_id: formData.address_id ? parseInt(formData.address_id) : null,
      engineer_id: formData.engineer_id ? parseInt(formData.engineer_id) : null,
      duration_minutes: parseInt(formData.duration_minutes)
    })
  }

  return (
    <Modal title="New Job" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <select
              required
              value={formData.customer_id}
              onChange={e => setFormData({ ...formData, customer_id: e.target.value, address_id: '' })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
            >
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <select
              value={formData.address_id}
              onChange={e => setFormData({ ...formData, address_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500"
              disabled={!formData.customer_id}
            >
              <option value="">Select address...</option>
              {addresses.map(a => (
                <option key={a.id} value={a.id}>
                  {a.address_line1}, {a.postcode}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Blocked drain, CCTV survey, Jetting"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
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
            Create Job
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

export default Jobs
