import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Briefcase, UserCog, Clock, CheckCircle, AlertCircle, Calendar, Ticket, AlertTriangle } from 'lucide-react'

function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching dashboard:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const stats = data?.stats || {}
  const recentJobs = data?.recent_jobs || []
  const upcomingJobs = data?.upcoming_jobs || []
  const recentTickets = data?.recent_tickets || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={Ticket}
          label="Open Tickets"
          value={stats.open_tickets}
          color="bg-red-500"
          link="/tickets?status=open"
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={stats.total_customers}
          color="bg-blue-500"
          link="/customers"
        />
        <StatCard
          icon={UserCog}
          label="Engineers"
          value={stats.total_engineers}
          color="bg-purple-500"
          link="/engineers"
        />
        <StatCard
          icon={Briefcase}
          label="Total Jobs"
          value={stats.total_jobs}
          color="bg-gray-500"
          link="/jobs"
        />
        <StatCard
          icon={Calendar}
          label="Today's Jobs"
          value={stats.today_jobs}
          color="bg-orange-500"
          link="/diary"
        />
      </div>

      {/* Ticket Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Ticket className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.open_tickets}</p>
              <p className="text-sm text-red-600">Open Tickets</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.in_progress_tickets}</p>
              <p className="text-sm text-blue-600">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-orange-700">{stats.high_priority_tickets}</p>
              <p className="text-sm text-orange-600">High Priority</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.resolved_tickets}</p>
              <p className="text-sm text-green-600">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending_jobs}</p>
              <p className="text-sm text-yellow-600">Pending Jobs</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.in_progress_jobs}</p>
              <p className="text-sm text-blue-600">Jobs In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.completed_jobs}</p>
              <p className="text-sm text-green-600">Jobs Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Recent Tickets</h2>
            <Link to="/tickets" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="p-4">
            {recentTickets.length === 0 ? (
              <p className="text-gray-500 text-sm">No tickets yet</p>
            ) : (
              <ul className="space-y-3">
                {recentTickets.map(ticket => (
                  <li key={ticket.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <TicketStatusBadge status={ticket.status} />
                    <div className="flex-1">
                      <Link to={`/tickets/${ticket.id}`} className="font-medium text-gray-800 hover:text-blue-600">
                        {ticket.title}
                      </Link>
                      <p className="text-sm text-gray-600">{ticket.customer_name}</p>
                    </div>
                    <PriorityBadge priority={ticket.priority} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Upcoming Jobs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Upcoming Jobs</h2>
            <Link to="/diary" className="text-sm text-blue-600 hover:underline">View Diary</Link>
          </div>
          <div className="p-4">
            {upcomingJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming jobs scheduled</p>
            ) : (
              <ul className="space-y-3">
                {upcomingJobs.map(job => (
                  <li key={job.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Link to={`/jobs/${job.id}`} className="font-medium text-gray-800 hover:text-blue-600">
                        {job.title}
                      </Link>
                      <p className="text-sm text-gray-600">{job.customer_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{job.scheduled_date}</span>
                        {job.scheduled_time && <span>{job.scheduled_time}</span>}
                        {job.postcode && <span className="bg-gray-200 px-2 py-0.5 rounded">{job.postcode}</span>}
                      </div>
                    </div>
                    {job.engineer_name && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {job.engineer_name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Recent Jobs</h2>
            <Link to="/jobs" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="p-4">
            {recentJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No jobs yet</p>
            ) : (
              <ul className="space-y-3">
                {recentJobs.map(job => (
                  <li key={job.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <StatusBadge status={job.status} />
                    <div className="flex-1">
                      <Link to={`/jobs/${job.id}`} className="font-medium text-gray-800 hover:text-blue-600">
                        {job.title}
                      </Link>
                      <p className="text-sm text-gray-600">{job.customer_name}</p>
                    </div>
                    {job.engineer_name && (
                      <span className="text-xs text-gray-500">{job.engineer_name}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, link }) {
  return (
    <Link to={link} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value || 0}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </Link>
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

export default Dashboard
