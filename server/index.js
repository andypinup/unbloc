import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = new Database(path.join(__dirname, 'unbloc.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS engineers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    color TEXT DEFAULT '#3b82f6',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT,
    county TEXT,
    postcode TEXT,
    is_primary INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    address_id INTEGER,
    engineer_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    scheduled_date DATE,
    scheduled_time TIME,
    duration_minutes INTEGER DEFAULT 60,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    FOREIGN KEY (engineer_id) REFERENCES engineers(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS job_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS snmp_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    device_type TEXT NOT NULL,
    location TEXT,
    description TEXT,
    snmp_community TEXT DEFAULT 'public',
    snmp_version TEXT DEFAULT 'v2c',
    poll_interval INTEGER DEFAULT 60,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS snmp_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    response_time INTEGER,
    uptime TEXT,
    cpu_usage INTEGER,
    memory_usage INTEGER,
    error_message TEXT,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES snmp_devices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS snmp_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    acknowledged INTEGER DEFAULT 0,
    acknowledged_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES snmp_devices(id) ON DELETE CASCADE
  );
`);

// Seed SNMP devices if table is empty
const deviceCount = db.prepare('SELECT COUNT(*) as count FROM snmp_devices').get().count;
if (deviceCount === 0) {
  const seedDevices = [
    { name: 'Main Router', ip: '192.168.1.1', type: 'router', location: 'Server Room', desc: 'Primary network router' },
    { name: 'Core Switch', ip: '192.168.1.2', type: 'switch', location: 'Server Room', desc: '48-port managed switch' },
    { name: 'Backup Server', ip: '192.168.1.10', type: 'server', location: 'Server Room', desc: 'Backup and storage server' },
    { name: 'Office Printer', ip: '192.168.1.50', type: 'printer', location: 'Main Office', desc: 'Network printer HP LaserJet' },
    { name: 'Warehouse AP', ip: '192.168.1.100', type: 'access_point', location: 'Warehouse', desc: 'Wireless access point' },
    { name: 'UPS System', ip: '192.168.1.200', type: 'ups', location: 'Server Room', desc: 'Uninterruptible power supply' },
    { name: 'CCTV NVR', ip: '192.168.1.201', type: 'nvr', location: 'Security Office', desc: 'Network video recorder' },
    { name: 'HVAC Controller', ip: '192.168.1.202', type: 'hvac', location: 'Plant Room', desc: 'Building climate control' },
  ];

  const insertDevice = db.prepare('INSERT INTO snmp_devices (name, ip_address, device_type, location, description) VALUES (?, ?, ?, ?, ?)');
  const insertStatus = db.prepare('INSERT INTO snmp_status (device_id, status, response_time, uptime, cpu_usage, memory_usage, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertAlert = db.prepare('INSERT INTO snmp_alerts (device_id, alert_type, severity, message) VALUES (?, ?, ?, ?)');

  seedDevices.forEach((device, index) => {
    const result = insertDevice.run(device.name, device.ip, device.type, device.location, device.desc);
    const deviceId = result.lastInsertRowid;

    // Add varied status data for realism
    const statuses = ['online', 'online', 'online', 'online', 'warning', 'offline'];
    const status = statuses[index % statuses.length];
    const responseTime = status === 'offline' ? null : Math.floor(Math.random() * 50) + 5;
    const uptime = status === 'offline' ? null : `${Math.floor(Math.random() * 90) + 1} days, ${Math.floor(Math.random() * 24)} hours`;
    const cpuUsage = status === 'offline' ? null : Math.floor(Math.random() * 80) + 5;
    const memoryUsage = status === 'offline' ? null : Math.floor(Math.random() * 70) + 20;
    const errorMsg = status === 'offline' ? 'Connection timeout - device unreachable' : (status === 'warning' ? 'High resource usage detected' : null);

    insertStatus.run(deviceId, status, responseTime, uptime, cpuUsage, memoryUsage, errorMsg);

    // Add some alerts for demo
    if (status === 'offline') {
      insertAlert.run(deviceId, 'connection_lost', 'critical', `Lost connection to ${device.name} at ${device.ip}`);
    } else if (status === 'warning') {
      insertAlert.run(deviceId, 'high_usage', 'warning', `High resource usage detected on ${device.name}`);
    }
  });

  console.log('Seeded SNMP devices for demo');
}

// ============ ENGINEERS API ============
app.get('/api/engineers', (req, res) => {
  const engineers = db.prepare('SELECT * FROM engineers ORDER BY name').all();
  res.json(engineers);
});

app.get('/api/engineers/:id', (req, res) => {
  const engineer = db.prepare('SELECT * FROM engineers WHERE id = ?').get(req.params.id);
  if (!engineer) return res.status(404).json({ error: 'Engineer not found' });
  res.json(engineer);
});

app.post('/api/engineers', (req, res) => {
  const { name, email, phone, color } = req.body;
  const result = db.prepare('INSERT INTO engineers (name, email, phone, color) VALUES (?, ?, ?, ?)').run(name, email, phone, color || '#3b82f6');
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/engineers/:id', (req, res) => {
  const { name, email, phone, color, active } = req.body;
  db.prepare('UPDATE engineers SET name = ?, email = ?, phone = ?, color = ?, active = ? WHERE id = ?').run(name, email, phone, color, active, req.params.id);
  res.json({ id: parseInt(req.params.id), ...req.body });
});

app.delete('/api/engineers/:id', (req, res) => {
  db.prepare('DELETE FROM engineers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ CUSTOMERS API ============
app.get('/api/customers', (req, res) => {
  const customers = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM addresses WHERE customer_id = c.id) as address_count,
      (SELECT COUNT(*) FROM jobs WHERE customer_id = c.id) as job_count
    FROM customers c
    ORDER BY c.name
  `).all();
  res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const addresses = db.prepare('SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_primary DESC').all(req.params.id);
  const jobs = db.prepare(`
    SELECT j.*, e.name as engineer_name, a.address_line1, a.postcode
    FROM jobs j
    LEFT JOIN engineers e ON j.engineer_id = e.id
    LEFT JOIN addresses a ON j.address_id = a.id
    WHERE j.customer_id = ?
    ORDER BY j.created_at DESC
  `).all(req.params.id);

  res.json({ ...customer, addresses, jobs });
});

app.post('/api/customers', (req, res) => {
  const { name, email, phone, mobile, notes } = req.body;
  const result = db.prepare('INSERT INTO customers (name, email, phone, mobile, notes) VALUES (?, ?, ?, ?, ?)').run(name, email, phone, mobile, notes);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/customers/:id', (req, res) => {
  const { name, email, phone, mobile, notes } = req.body;
  db.prepare('UPDATE customers SET name = ?, email = ?, phone = ?, mobile = ?, notes = ? WHERE id = ?').run(name, email, phone, mobile, notes, req.params.id);
  res.json({ id: parseInt(req.params.id), ...req.body });
});

app.delete('/api/customers/:id', (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ ADDRESSES API ============
app.get('/api/customers/:customerId/addresses', (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_primary DESC').all(req.params.customerId);
  res.json(addresses);
});

app.post('/api/customers/:customerId/addresses', (req, res) => {
  const { address_line1, address_line2, city, county, postcode, is_primary } = req.body;

  if (is_primary) {
    db.prepare('UPDATE addresses SET is_primary = 0 WHERE customer_id = ?').run(req.params.customerId);
  }

  const result = db.prepare('INSERT INTO addresses (customer_id, address_line1, address_line2, city, county, postcode, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.params.customerId, address_line1, address_line2, city, county, postcode, is_primary ? 1 : 0);
  res.json({ id: result.lastInsertRowid, customer_id: parseInt(req.params.customerId), ...req.body });
});

app.put('/api/addresses/:id', (req, res) => {
  const { address_line1, address_line2, city, county, postcode, is_primary, customer_id } = req.body;

  if (is_primary) {
    db.prepare('UPDATE addresses SET is_primary = 0 WHERE customer_id = ?').run(customer_id);
  }

  db.prepare('UPDATE addresses SET address_line1 = ?, address_line2 = ?, city = ?, county = ?, postcode = ?, is_primary = ? WHERE id = ?').run(address_line1, address_line2, city, county, postcode, is_primary ? 1 : 0, req.params.id);
  res.json({ id: parseInt(req.params.id), ...req.body });
});

app.delete('/api/addresses/:id', (req, res) => {
  db.prepare('DELETE FROM addresses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ JOBS API ============
app.get('/api/jobs', (req, res) => {
  const { status, engineer_id, date_from, date_to } = req.query;

  let query = `
    SELECT j.*,
      c.name as customer_name, c.phone as customer_phone,
      e.name as engineer_name, e.color as engineer_color,
      a.address_line1, a.city, a.postcode,
      (SELECT COUNT(*) FROM job_notes WHERE job_id = j.id) as note_count
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN engineers e ON j.engineer_id = e.id
    LEFT JOIN addresses a ON j.address_id = a.id
    WHERE 1=1
  `;

  const params = [];

  if (status) {
    query += ' AND j.status = ?';
    params.push(status);
  }

  if (engineer_id) {
    query += ' AND j.engineer_id = ?';
    params.push(engineer_id);
  }

  if (date_from) {
    query += ' AND j.scheduled_date >= ?';
    params.push(date_from);
  }

  if (date_to) {
    query += ' AND j.scheduled_date <= ?';
    params.push(date_to);
  }

  query += ' ORDER BY j.scheduled_date DESC, j.scheduled_time DESC';

  const jobs = db.prepare(query).all(...params);
  res.json(jobs);
});

app.get('/api/jobs/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*,
      c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
      e.name as engineer_name, e.color as engineer_color,
      a.address_line1, a.address_line2, a.city, a.county, a.postcode
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN engineers e ON j.engineer_id = e.id
    LEFT JOIN addresses a ON j.address_id = a.id
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) return res.status(404).json({ error: 'Job not found' });

  const notes = db.prepare('SELECT * FROM job_notes WHERE job_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({ ...job, notes });
});

app.post('/api/jobs', (req, res) => {
  const { customer_id, address_id, engineer_id, title, description, status, priority, scheduled_date, scheduled_time, duration_minutes } = req.body;
  const result = db.prepare('INSERT INTO jobs (customer_id, address_id, engineer_id, title, description, status, priority, scheduled_date, scheduled_time, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(customer_id, address_id, engineer_id, title, description, status || 'pending', priority || 'normal', scheduled_date, scheduled_time, duration_minutes || 60);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/jobs/:id', (req, res) => {
  const { customer_id, address_id, engineer_id, title, description, status, priority, scheduled_date, scheduled_time, duration_minutes } = req.body;

  let completed_at = null;
  if (status === 'completed') {
    const existing = db.prepare('SELECT completed_at FROM jobs WHERE id = ?').get(req.params.id);
    completed_at = existing?.completed_at || new Date().toISOString();
  }

  db.prepare('UPDATE jobs SET customer_id = ?, address_id = ?, engineer_id = ?, title = ?, description = ?, status = ?, priority = ?, scheduled_date = ?, scheduled_time = ?, duration_minutes = ?, completed_at = ? WHERE id = ?').run(customer_id, address_id, engineer_id, title, description, status, priority, scheduled_date, scheduled_time, duration_minutes, completed_at, req.params.id);
  res.json({ id: parseInt(req.params.id), ...req.body, completed_at });
});

app.delete('/api/jobs/:id', (req, res) => {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ JOB NOTES API ============
app.get('/api/jobs/:jobId/notes', (req, res) => {
  const notes = db.prepare('SELECT * FROM job_notes WHERE job_id = ? ORDER BY created_at DESC').all(req.params.jobId);
  res.json(notes);
});

app.post('/api/jobs/:jobId/notes', (req, res) => {
  const { note } = req.body;
  const result = db.prepare('INSERT INTO job_notes (job_id, note) VALUES (?, ?)').run(req.params.jobId, note);
  res.json({ id: result.lastInsertRowid, job_id: parseInt(req.params.jobId), note, created_at: new Date().toISOString() });
});

app.delete('/api/notes/:id', (req, res) => {
  db.prepare('DELETE FROM job_notes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ CALENDAR API ============
app.get('/api/calendar', (req, res) => {
  const { start, end } = req.query;

  const jobs = db.prepare(`
    SELECT j.id, j.title, j.scheduled_date, j.scheduled_time, j.duration_minutes, j.status, j.priority,
      c.name as customer_name,
      e.name as engineer_name, e.color as engineer_color,
      a.postcode
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN engineers e ON j.engineer_id = e.id
    LEFT JOIN addresses a ON j.address_id = a.id
    WHERE j.scheduled_date BETWEEN ? AND ?
    ORDER BY j.scheduled_date, j.scheduled_time
  `).all(start, end);

  const events = jobs.map(job => ({
    id: job.id.toString(),
    title: `${job.customer_name} - ${job.title}`,
    start: job.scheduled_time ? `${job.scheduled_date}T${job.scheduled_time}` : job.scheduled_date,
    end: job.scheduled_time ? calculateEndTime(job.scheduled_date, job.scheduled_time, job.duration_minutes) : null,
    backgroundColor: getStatusColor(job.status, job.engineer_color),
    borderColor: job.engineer_color || '#3b82f6',
    extendedProps: {
      status: job.status,
      priority: job.priority,
      engineer: job.engineer_name,
      postcode: job.postcode
    }
  }));

  res.json(events);
});

function calculateEndTime(date, time, duration) {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${date}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
}

function getStatusColor(status, engineerColor) {
  switch (status) {
    case 'completed': return '#22c55e';
    case 'in_progress': return '#f59e0b';
    case 'cancelled': return '#ef4444';
    default: return engineerColor || '#3b82f6';
  }
}

// ============ DASHBOARD API ============
app.get('/api/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const stats = {
    total_customers: db.prepare('SELECT COUNT(*) as count FROM customers').get().count,
    total_engineers: db.prepare('SELECT COUNT(*) as count FROM engineers WHERE active = 1').get().count,
    total_jobs: db.prepare('SELECT COUNT(*) as count FROM jobs').get().count,
    pending_jobs: db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = "pending"').get().count,
    in_progress_jobs: db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = "in_progress"').get().count,
    completed_jobs: db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = "completed"').get().count,
    today_jobs: db.prepare('SELECT COUNT(*) as count FROM jobs WHERE scheduled_date = ?').get(today).count
  };

  const recent_jobs = db.prepare(`
    SELECT j.*, c.name as customer_name, e.name as engineer_name
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN engineers e ON j.engineer_id = e.id
    ORDER BY j.created_at DESC
    LIMIT 5
  `).all();

  const upcoming_jobs = db.prepare(`
    SELECT j.*, c.name as customer_name, e.name as engineer_name, a.postcode
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN engineers e ON j.engineer_id = e.id
    LEFT JOIN addresses a ON j.address_id = a.id
    WHERE j.scheduled_date >= ? AND j.status != 'completed' AND j.status != 'cancelled'
    ORDER BY j.scheduled_date, j.scheduled_time
    LIMIT 10
  `).all(today);

  res.json({ stats, recent_jobs, upcoming_jobs });
});

// ============ SNMP DEVICES API ============

// Get all devices with latest status
app.get('/api/snmp/devices', (req, res) => {
  const devices = db.prepare(`
    SELECT d.*,
      s.status, s.response_time, s.uptime, s.cpu_usage, s.memory_usage, s.error_message, s.checked_at,
      (SELECT COUNT(*) FROM snmp_alerts WHERE device_id = d.id AND acknowledged = 0) as active_alerts
    FROM snmp_devices d
    LEFT JOIN (
      SELECT device_id, status, response_time, uptime, cpu_usage, memory_usage, error_message, checked_at
      FROM snmp_status
      WHERE id IN (SELECT MAX(id) FROM snmp_status GROUP BY device_id)
    ) s ON d.id = s.device_id
    ORDER BY
      CASE s.status
        WHEN 'offline' THEN 1
        WHEN 'warning' THEN 2
        ELSE 3
      END,
      d.name
  `).all();
  res.json(devices);
});

// Get single device with status history
app.get('/api/snmp/devices/:id', (req, res) => {
  const device = db.prepare('SELECT * FROM snmp_devices WHERE id = ?').get(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const latestStatus = db.prepare(`
    SELECT * FROM snmp_status WHERE device_id = ? ORDER BY checked_at DESC LIMIT 1
  `).get(req.params.id);

  const statusHistory = db.prepare(`
    SELECT * FROM snmp_status WHERE device_id = ? ORDER BY checked_at DESC LIMIT 50
  `).all(req.params.id);

  const alerts = db.prepare(`
    SELECT * FROM snmp_alerts WHERE device_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(req.params.id);

  res.json({ ...device, latestStatus, statusHistory, alerts });
});

// Create new device
app.post('/api/snmp/devices', (req, res) => {
  const { name, ip_address, device_type, location, description, snmp_community, snmp_version, poll_interval, enabled } = req.body;
  const result = db.prepare(`
    INSERT INTO snmp_devices (name, ip_address, device_type, location, description, snmp_community, snmp_version, poll_interval, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, ip_address, device_type, location, description, snmp_community || 'public', snmp_version || 'v2c', poll_interval || 60, enabled !== undefined ? enabled : 1);

  // Add initial status check
  db.prepare(`
    INSERT INTO snmp_status (device_id, status, response_time, uptime, cpu_usage, memory_usage)
    VALUES (?, 'online', ?, ?, ?, ?)
  `).run(result.lastInsertRowid, Math.floor(Math.random() * 30) + 5, '0 days, 0 hours', Math.floor(Math.random() * 30) + 5, Math.floor(Math.random() * 40) + 20);

  res.json({ id: result.lastInsertRowid, ...req.body });
});

// Update device
app.put('/api/snmp/devices/:id', (req, res) => {
  const { name, ip_address, device_type, location, description, snmp_community, snmp_version, poll_interval, enabled } = req.body;
  db.prepare(`
    UPDATE snmp_devices SET name = ?, ip_address = ?, device_type = ?, location = ?, description = ?,
    snmp_community = ?, snmp_version = ?, poll_interval = ?, enabled = ? WHERE id = ?
  `).run(name, ip_address, device_type, location, description, snmp_community, snmp_version, poll_interval, enabled, req.params.id);
  res.json({ id: parseInt(req.params.id), ...req.body });
});

// Delete device
app.delete('/api/snmp/devices/:id', (req, res) => {
  db.prepare('DELETE FROM snmp_devices WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Poll device (simulate SNMP query)
app.post('/api/snmp/devices/:id/poll', (req, res) => {
  const device = db.prepare('SELECT * FROM snmp_devices WHERE id = ?').get(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  // Simulate SNMP polling with randomized results
  const statusOptions = ['online', 'online', 'online', 'online', 'online', 'warning', 'offline'];
  const newStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
  const responseTime = newStatus === 'offline' ? null : Math.floor(Math.random() * 50) + 5;
  const uptime = newStatus === 'offline' ? null : `${Math.floor(Math.random() * 90) + 1} days, ${Math.floor(Math.random() * 24)} hours`;
  const cpuUsage = newStatus === 'offline' ? null : Math.floor(Math.random() * 80) + 5;
  const memoryUsage = newStatus === 'offline' ? null : Math.floor(Math.random() * 70) + 20;
  const errorMsg = newStatus === 'offline' ? 'Connection timeout - device unreachable' : (newStatus === 'warning' ? 'High resource usage detected' : null);

  // Insert new status record
  const result = db.prepare(`
    INSERT INTO snmp_status (device_id, status, response_time, uptime, cpu_usage, memory_usage, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, newStatus, responseTime, uptime, cpuUsage, memoryUsage, errorMsg);

  // Create alert if status changed to offline or warning
  const previousStatus = db.prepare(`
    SELECT status FROM snmp_status WHERE device_id = ? AND id != ? ORDER BY checked_at DESC LIMIT 1
  `).get(req.params.id, result.lastInsertRowid);

  if (previousStatus && previousStatus.status !== newStatus) {
    if (newStatus === 'offline') {
      db.prepare(`
        INSERT INTO snmp_alerts (device_id, alert_type, severity, message)
        VALUES (?, 'connection_lost', 'critical', ?)
      `).run(req.params.id, `Lost connection to ${device.name} at ${device.ip_address}`);
    } else if (newStatus === 'warning') {
      db.prepare(`
        INSERT INTO snmp_alerts (device_id, alert_type, severity, message)
        VALUES (?, 'high_usage', 'warning', ?)
      `).run(req.params.id, `High resource usage detected on ${device.name}`);
    } else if (previousStatus.status === 'offline' && newStatus === 'online') {
      db.prepare(`
        INSERT INTO snmp_alerts (device_id, alert_type, severity, message)
        VALUES (?, 'connection_restored', 'info', ?)
      `).run(req.params.id, `Connection restored to ${device.name} at ${device.ip_address}`);
    }
  }

  res.json({
    device_id: parseInt(req.params.id),
    status: newStatus,
    response_time: responseTime,
    uptime,
    cpu_usage: cpuUsage,
    memory_usage: memoryUsage,
    error_message: errorMsg,
    checked_at: new Date().toISOString()
  });
});

// Poll all enabled devices
app.post('/api/snmp/poll-all', (req, res) => {
  const devices = db.prepare('SELECT * FROM snmp_devices WHERE enabled = 1').all();
  const results = [];

  devices.forEach(device => {
    const statusOptions = ['online', 'online', 'online', 'online', 'online', 'warning', 'offline'];
    const newStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const responseTime = newStatus === 'offline' ? null : Math.floor(Math.random() * 50) + 5;
    const uptime = newStatus === 'offline' ? null : `${Math.floor(Math.random() * 90) + 1} days, ${Math.floor(Math.random() * 24)} hours`;
    const cpuUsage = newStatus === 'offline' ? null : Math.floor(Math.random() * 80) + 5;
    const memoryUsage = newStatus === 'offline' ? null : Math.floor(Math.random() * 70) + 20;
    const errorMsg = newStatus === 'offline' ? 'Connection timeout - device unreachable' : (newStatus === 'warning' ? 'High resource usage detected' : null);

    db.prepare(`
      INSERT INTO snmp_status (device_id, status, response_time, uptime, cpu_usage, memory_usage, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(device.id, newStatus, responseTime, uptime, cpuUsage, memoryUsage, errorMsg);

    results.push({ device_id: device.id, name: device.name, status: newStatus });
  });

  res.json({ polled: results.length, results });
});

// Get SNMP dashboard summary
app.get('/api/snmp/summary', (req, res) => {
  const totalDevices = db.prepare('SELECT COUNT(*) as count FROM snmp_devices').get().count;
  const enabledDevices = db.prepare('SELECT COUNT(*) as count FROM snmp_devices WHERE enabled = 1').get().count;

  const statusCounts = db.prepare(`
    SELECT s.status, COUNT(*) as count
    FROM snmp_devices d
    LEFT JOIN (
      SELECT device_id, status
      FROM snmp_status
      WHERE id IN (SELECT MAX(id) FROM snmp_status GROUP BY device_id)
    ) s ON d.id = s.device_id
    WHERE d.enabled = 1
    GROUP BY s.status
  `).all();

  const statusMap = { online: 0, warning: 0, offline: 0 };
  statusCounts.forEach(s => {
    if (s.status) statusMap[s.status] = s.count;
  });

  const activeAlerts = db.prepare('SELECT COUNT(*) as count FROM snmp_alerts WHERE acknowledged = 0').get().count;
  const criticalAlerts = db.prepare("SELECT COUNT(*) as count FROM snmp_alerts WHERE acknowledged = 0 AND severity = 'critical'").get().count;

  const recentAlerts = db.prepare(`
    SELECT a.*, d.name as device_name, d.ip_address
    FROM snmp_alerts a
    JOIN snmp_devices d ON a.device_id = d.id
    WHERE a.acknowledged = 0
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();

  res.json({
    total_devices: totalDevices,
    enabled_devices: enabledDevices,
    online_devices: statusMap.online,
    warning_devices: statusMap.warning,
    offline_devices: statusMap.offline,
    active_alerts: activeAlerts,
    critical_alerts: criticalAlerts,
    recent_alerts: recentAlerts
  });
});

// Get all alerts
app.get('/api/snmp/alerts', (req, res) => {
  const { acknowledged } = req.query;
  let query = `
    SELECT a.*, d.name as device_name, d.ip_address
    FROM snmp_alerts a
    JOIN snmp_devices d ON a.device_id = d.id
  `;

  if (acknowledged !== undefined) {
    query += ` WHERE a.acknowledged = ${acknowledged === 'true' ? 1 : 0}`;
  }

  query += ' ORDER BY a.created_at DESC LIMIT 100';

  const alerts = db.prepare(query).all();
  res.json(alerts);
});

// Acknowledge alert
app.put('/api/snmp/alerts/:id/acknowledge', (req, res) => {
  db.prepare('UPDATE snmp_alerts SET acknowledged = 1, acknowledged_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);
  res.json({ success: true });
});

// Acknowledge all alerts for a device
app.put('/api/snmp/devices/:id/acknowledge-alerts', (req, res) => {
  db.prepare('UPDATE snmp_alerts SET acknowledged = 1, acknowledged_at = ? WHERE device_id = ? AND acknowledged = 0').run(new Date().toISOString(), req.params.id);
  res.json({ success: true });
});

// ============ SERVE FRONTEND (Production) ============
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Unbloc running at http://localhost:${PORT}`);
});
