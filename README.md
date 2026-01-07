# Unbloc - Job Management System

A web-based job management application for Unbloc drainage company. Manage customers, addresses, engineers, and jobs with an integrated diary/calendar view.

## Features

- **Dashboard** - Overview of jobs, customers, and engineers with quick stats
- **Customer Management** - Add, edit, and delete customers with multiple addresses
- **Job Management** - Create and track jobs with status, priority, and detailed notes
- **Engineer Management** - Manage your team with color-coded calendar entries
- **Diary/Calendar** - Visual scheduling with day, week, and month views
- **Job Notes** - Add timestamped notes to track job progress

## Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS, FullCalendar
- **Backend**: Node.js, Express.js
- **Database**: SQLite (via better-sqlite3)

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
npm install
```

### Running Locally (Recommended)

Build and run the complete application on a single server:

```bash
npm run local
```

Then open `http://localhost:3000` in your browser.

### Development Mode

For development with hot-reloading:

```bash
npm run dev
```

This runs the frontend on port 5173 with the API on port 3000.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run local` | Build and run production server |
| `npm start` | Run production server (requires build first) |
| `npm run dev` | Run development servers with hot-reload |
| `npm run build` | Build frontend for production |

## Project Structure

```
unbloc/
├── server/
│   └── index.js          # Express API server + SQLite database
├── src/
│   ├── components/
│   │   ├── Layout.jsx    # Main app layout with navigation
│   │   └── Modal.jsx     # Reusable modal component
│   ├── pages/
│   │   ├── Dashboard.jsx     # Home dashboard
│   │   ├── Customers.jsx     # Customer list
│   │   ├── CustomerDetail.jsx # Single customer view
│   │   ├── Jobs.jsx          # Jobs list
│   │   ├── JobDetail.jsx     # Single job view with notes
│   │   ├── Engineers.jsx     # Engineer management
│   │   └── Diary.jsx         # Calendar/scheduling view
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── README.md
```

## API Endpoints

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer with addresses and jobs
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Addresses
- `GET /api/customers/:id/addresses` - List customer addresses
- `POST /api/customers/:id/addresses` - Add address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

### Engineers
- `GET /api/engineers` - List all engineers
- `POST /api/engineers` - Create engineer
- `PUT /api/engineers/:id` - Update engineer
- `DELETE /api/engineers/:id` - Delete engineer

### Jobs
- `GET /api/jobs` - List jobs (with optional filters)
- `GET /api/jobs/:id` - Get job with notes
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Job Notes
- `GET /api/jobs/:id/notes` - List job notes
- `POST /api/jobs/:id/notes` - Add note
- `DELETE /api/notes/:id` - Delete note

### Other
- `GET /api/calendar` - Get calendar events for date range
- `GET /api/dashboard` - Get dashboard statistics

## Database

The application uses SQLite for data storage. The database file (`unbloc.db`) is automatically created in the `server/` directory on first run.

Tables:
- `customers` - Customer information
- `addresses` - Customer addresses (multiple per customer)
- `engineers` - Engineer/technician details
- `jobs` - Job records with scheduling
- `job_notes` - Notes attached to jobs

## License

Private - Unbloc Drainage Services
