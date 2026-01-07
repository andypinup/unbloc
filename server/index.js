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
`);

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
