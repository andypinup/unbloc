import { NavLink } from 'react-router-dom'
import { Home, Users, Briefcase, UserCog, Calendar, Ticket, Shield } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/diary', icon: Calendar, label: 'Diary' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/engineers', icon: UserCog, label: 'Engineers' },
]

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-unbloc-800 text-white flex flex-col">
        <div className="p-4 border-b border-unbloc-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-unbloc-800" />
            </div>
            <div>
              <h1 className="text-xl font-bold">IT Mighty</h1>
              <p className="text-xs text-unbloc-300">IT Support</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-unbloc-600 text-white'
                        : 'text-unbloc-200 hover:bg-unbloc-700 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-unbloc-700 text-xs text-unbloc-400">
          <p>IT Mighty Support</p>
          <p>v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
