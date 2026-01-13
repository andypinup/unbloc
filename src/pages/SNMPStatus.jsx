import { useState, useEffect, useCallback } from 'react'
import {
  Wifi, WifiOff, AlertTriangle, CheckCircle, RefreshCw, Server,
  Router, Monitor, Printer, Radio, Battery, Video, Thermometer,
  Clock, Cpu, HardDrive, Bell, BellOff, Plus, X, ChevronDown, ChevronUp
} from 'lucide-react'
import Modal from '../components/Modal'

const deviceTypeIcons = {
  router: Router,
  switch: Server,
  server: Monitor,
  printer: Printer,
  access_point: Radio,
  ups: Battery,
  nvr: Video,
  hvac: Thermometer,
  default: Server
}

const deviceTypeLabels = {
  router: 'Router',
  switch: 'Network Switch',
  server: 'Server',
  printer: 'Printer',
  access_point: 'Access Point',
  ups: 'UPS',
  nvr: 'NVR',
  hvac: 'HVAC Controller'
}

function SNMPStatus() {
  const [devices, setDevices] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedAlerts, setExpandedAlerts] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [devicesRes, summaryRes] = await Promise.all([
        fetch('/api/snmp/devices'),
        fetch('/api/snmp/summary')
      ])
      const devicesData = await devicesRes.json()
      const summaryData = await summaryRes.json()
      setDevices(devicesData)
      setSummary(summaryData)
    } catch (err) {
      console.error('Error fetching SNMP data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  const pollAllDevices = async () => {
    setPolling(true)
    try {
      await fetch('/api/snmp/poll-all', { method: 'POST' })
      await fetchData()
    } catch (err) {
      console.error('Error polling devices:', err)
    } finally {
      setPolling(false)
    }
  }

  const pollDevice = async (deviceId) => {
    try {
      await fetch(`/api/snmp/devices/${deviceId}/poll`, { method: 'POST' })
      await fetchData()
      if (selectedDevice?.id === deviceId) {
        const res = await fetch(`/api/snmp/devices/${deviceId}`)
        setSelectedDevice(await res.json())
      }
    } catch (err) {
      console.error('Error polling device:', err)
    }
  }

  const acknowledgeAlert = async (alertId) => {
    try {
      await fetch(`/api/snmp/alerts/${alertId}/acknowledge`, { method: 'PUT' })
      await fetchData()
    } catch (err) {
      console.error('Error acknowledging alert:', err)
    }
  }

  const viewDeviceDetails = async (deviceId) => {
    try {
      const res = await fetch(`/api/snmp/devices/${deviceId}`)
      setSelectedDevice(await res.json())
      setShowDeviceModal(true)
    } catch (err) {
      console.error('Error fetching device details:', err)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading SNMP devices...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SNMP Network Status</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={pollAllDevices}
            disabled={polling}
            className="flex items-center gap-2 px-4 py-2 bg-unbloc-600 text-white rounded-lg hover:bg-unbloc-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
            {polling ? 'Polling...' : 'Poll All Devices'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <SummaryCard
            icon={Server}
            label="Total Devices"
            value={summary.total_devices}
            color="bg-gray-500"
          />
          <SummaryCard
            icon={CheckCircle}
            label="Online"
            value={summary.online_devices}
            color="bg-green-500"
          />
          <SummaryCard
            icon={AlertTriangle}
            label="Warning"
            value={summary.warning_devices}
            color="bg-yellow-500"
          />
          <SummaryCard
            icon={WifiOff}
            label="Offline"
            value={summary.offline_devices}
            color="bg-red-500"
          />
          <SummaryCard
            icon={Bell}
            label="Active Alerts"
            value={summary.active_alerts}
            color="bg-orange-500"
          />
          <SummaryCard
            icon={AlertTriangle}
            label="Critical"
            value={summary.critical_alerts}
            color="bg-red-600"
          />
          <SummaryCard
            icon={Wifi}
            label="Enabled"
            value={summary.enabled_devices}
            color="bg-blue-500"
          />
        </div>
      )}

      {/* Alerts Panel */}
      {summary?.recent_alerts?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg mb-6">
          <button
            onClick={() => setExpandedAlerts(!expandedAlerts)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">
                Active Alerts ({summary.active_alerts})
              </span>
            </div>
            {expandedAlerts ? (
              <ChevronUp className="w-5 h-5 text-red-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-red-600" />
            )}
          </button>
          {expandedAlerts && (
            <div className="px-4 pb-4 space-y-2">
              {summary.recent_alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    alert.severity === 'critical' ? 'bg-red-100' :
                    alert.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${
                      alert.severity === 'critical' ? 'text-red-600' :
                      alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-800">{alert.message}</p>
                      <p className="text-sm text-gray-600">
                        {alert.device_name} ({alert.ip_address}) - {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-white rounded hover:bg-gray-100"
                  >
                    <BellOff className="w-4 h-4" />
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {devices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            onPoll={() => pollDevice(device.id)}
            onViewDetails={() => viewDeviceDetails(device.id)}
          />
        ))}
      </div>

      {devices.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Server className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No SNMP devices configured</p>
          <p className="text-sm">Add devices to start monitoring your network</p>
        </div>
      )}

      {/* Device Detail Modal */}
      <Modal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        title={selectedDevice?.name || 'Device Details'}
        size="xl"
      >
        {selectedDevice && (
          <DeviceDetailView
            device={selectedDevice}
            onPoll={() => pollDevice(selectedDevice.id)}
            onClose={() => setShowDeviceModal(false)}
          />
        )}
      </Modal>

      {/* Add Device Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add SNMP Device"
        size="lg"
      >
        <AddDeviceForm
          onSuccess={() => {
            setShowAddModal(false)
            fetchData()
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value || 0}</p>
          <p className="text-xs text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  )
}

function DeviceCard({ device, onPoll, onViewDetails }) {
  const Icon = deviceTypeIcons[device.device_type] || deviceTypeIcons.default

  const statusColors = {
    online: 'border-green-500 bg-green-50',
    warning: 'border-yellow-500 bg-yellow-50',
    offline: 'border-red-500 bg-red-50'
  }

  const statusIcons = {
    online: <CheckCircle className="w-5 h-5 text-green-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    offline: <WifiOff className="w-5 h-5 text-red-600" />
  }

  return (
    <div
      className={`bg-white rounded-lg shadow border-l-4 ${statusColors[device.status] || 'border-gray-300'} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onViewDetails}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{device.name}</h3>
              <p className="text-sm text-gray-500">{device.ip_address}</p>
            </div>
          </div>
          {statusIcons[device.status]}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Type</span>
            <span className="font-medium">{deviceTypeLabels[device.device_type] || device.device_type}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Location</span>
            <span className="font-medium">{device.location || '-'}</span>
          </div>
          {device.status !== 'offline' && device.response_time && (
            <div className="flex justify-between text-gray-600">
              <span>Response</span>
              <span className="font-medium">{device.response_time}ms</span>
            </div>
          )}
          {device.status === 'offline' && device.error_message && (
            <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
              {device.error_message}
            </div>
          )}
        </div>

        {device.active_alerts > 0 && (
          <div className="mt-3 flex items-center gap-1 text-orange-600 text-sm">
            <Bell className="w-4 h-4" />
            <span>{device.active_alerts} active alert{device.active_alerts > 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {device.checked_at ? `Last check: ${new Date(device.checked_at).toLocaleTimeString()}` : 'Never checked'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPoll()
            }}
            className="p-1.5 text-gray-500 hover:text-unbloc-600 hover:bg-gray-100 rounded"
            title="Poll device"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function DeviceDetailView({ device, onPoll, onClose }) {
  const Icon = deviceTypeIcons[device.device_type] || deviceTypeIcons.default
  const status = device.latestStatus || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
            <Icon className="w-8 h-8 text-gray-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{device.name}</h2>
            <p className="text-gray-500">{device.ip_address}</p>
            <p className="text-sm text-gray-400">{device.description}</p>
          </div>
        </div>
        <StatusBadge status={status.status} large />
      </div>

      {/* Current Status */}
      {status.status !== 'offline' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Clock}
            label="Response Time"
            value={status.response_time ? `${status.response_time}ms` : '-'}
          />
          <MetricCard
            icon={Clock}
            label="Uptime"
            value={status.uptime || '-'}
          />
          <MetricCard
            icon={Cpu}
            label="CPU Usage"
            value={status.cpu_usage ? `${status.cpu_usage}%` : '-'}
            warning={status.cpu_usage > 80}
          />
          <MetricCard
            icon={HardDrive}
            label="Memory Usage"
            value={status.memory_usage ? `${status.memory_usage}%` : '-'}
            warning={status.memory_usage > 80}
          />
        </div>
      )}

      {status.status === 'offline' && status.error_message && (
        <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">Connection Error</span>
          </div>
          <p className="mt-2 text-red-600">{status.error_message}</p>
        </div>
      )}

      {/* Device Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Device Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="ml-2 font-medium">{deviceTypeLabels[device.device_type] || device.device_type}</span>
          </div>
          <div>
            <span className="text-gray-500">Location:</span>
            <span className="ml-2 font-medium">{device.location || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">SNMP Version:</span>
            <span className="ml-2 font-medium">{device.snmp_version}</span>
          </div>
          <div>
            <span className="text-gray-500">Poll Interval:</span>
            <span className="ml-2 font-medium">{device.poll_interval}s</span>
          </div>
          <div>
            <span className="text-gray-500">Community:</span>
            <span className="ml-2 font-medium">{device.snmp_community}</span>
          </div>
          <div>
            <span className="text-gray-500">Enabled:</span>
            <span className={`ml-2 font-medium ${device.enabled ? 'text-green-600' : 'text-red-600'}`}>
              {device.enabled ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {device.alerts?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Recent Alerts</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {device.alerts.map(alert => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  alert.acknowledged ? 'bg-gray-100' :
                  alert.severity === 'critical' ? 'bg-red-100' :
                  alert.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SeverityIcon severity={alert.severity} acknowledged={alert.acknowledged} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                    <p className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {alert.acknowledged && (
                  <span className="text-xs text-gray-500">Acknowledged</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status History */}
      {device.statusHistory?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Status History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Response</th>
                  <th className="pb-2">CPU</th>
                  <th className="pb-2">Memory</th>
                </tr>
              </thead>
              <tbody>
                {device.statusHistory.slice(0, 10).map((entry, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2">{new Date(entry.checked_at).toLocaleTimeString()}</td>
                    <td className="py-2">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="py-2">{entry.response_time ? `${entry.response_time}ms` : '-'}</td>
                    <td className="py-2">{entry.cpu_usage ? `${entry.cpu_usage}%` : '-'}</td>
                    <td className="py-2">{entry.memory_usage ? `${entry.memory_usage}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onPoll}
          className="flex items-center gap-2 px-4 py-2 bg-unbloc-600 text-white rounded-lg hover:bg-unbloc-700"
        >
          <RefreshCw className="w-4 h-4" />
          Poll Now
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, warning }) {
  return (
    <div className={`p-3 rounded-lg ${warning ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${warning ? 'text-yellow-600' : 'text-gray-500'}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${warning ? 'text-yellow-700' : 'text-gray-800'}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status, large }) {
  const styles = {
    online: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    offline: 'bg-red-100 text-red-700'
  }

  const labels = {
    online: 'Online',
    warning: 'Warning',
    offline: 'Offline'
  }

  return (
    <span className={`${large ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded-full font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status || 'Unknown'}
    </span>
  )
}

function SeverityIcon({ severity, acknowledged }) {
  if (acknowledged) {
    return <CheckCircle className="w-4 h-4 text-gray-400" />
  }

  switch (severity) {
    case 'critical':
      return <AlertTriangle className="w-4 h-4 text-red-600" />
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />
    default:
      return <Bell className="w-4 h-4 text-blue-600" />
  }
}

function AddDeviceForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    device_type: 'server',
    location: '',
    description: '',
    snmp_community: 'public',
    snmp_version: 'v2c',
    poll_interval: 60,
    enabled: true
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/snmp/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          enabled: formData.enabled ? 1 : 0
        })
      })
      if (res.ok) {
        onSuccess()
      }
    } catch (err) {
      console.error('Error adding device:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Device Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 focus:border-unbloc-500"
            placeholder="Main Router"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IP Address *</label>
          <input
            type="text"
            required
            value={formData.ip_address}
            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 focus:border-unbloc-500"
            placeholder="192.168.1.1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
          <select
            value={formData.device_type}
            onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 focus:border-unbloc-500"
          >
            <option value="router">Router</option>
            <option value="switch">Network Switch</option>
            <option value="server">Server</option>
            <option value="printer">Printer</option>
            <option value="access_point">Access Point</option>
            <option value="ups">UPS</option>
            <option value="nvr">NVR</option>
            <option value="hvac">HVAC Controller</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 focus:border-unbloc-500"
            placeholder="Server Room"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 focus:border-unbloc-500"
          placeholder="Primary network router"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SNMP Community</label>
          <input
            type="text"
            value={formData.snmp_community}
            onChange={(e) => setFormData({ ...formData, snmp_community: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 focus:border-unbloc-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SNMP Version</label>
          <select
            value={formData.snmp_version}
            onChange={(e) => setFormData({ ...formData, snmp_version: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 focus:border-unbloc-500"
          >
            <option value="v1">v1</option>
            <option value="v2c">v2c</option>
            <option value="v3">v3</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Poll Interval (s)</label>
          <input
            type="number"
            min="10"
            value={formData.poll_interval}
            onChange={(e) => setFormData({ ...formData, poll_interval: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-unbloc-500 focus:border-unbloc-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enabled"
          checked={formData.enabled}
          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="enabled" className="text-sm text-gray-700">Enable monitoring</label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add Device'}
        </button>
      </div>
    </form>
  )
}

export default SNMPStatus
