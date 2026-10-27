import { NavLink, Outlet } from 'react-router'
import { logout, useAuth } from '../auth/useAuth'
import { Shield } from './Shield'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/incidents', label: 'Incident Queue' },
  { to: '/alerts', label: 'Broadcast Alerts' },
  { to: '/users', label: 'Users' },
  { to: '/incident-types', label: 'Incident Types' },
  { to: '/location-tags', label: 'Location Tags' },
  { to: '/analytics', label: 'Analytics' },
]

export function DashboardLayout() {
  const { user, profile } = useAuth()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col bg-slate-900 text-slate-200 md:w-60">
        <div className="flex items-center gap-2 px-5 py-4">
          <Shield className="h-7 w-7 text-brand-500" />
          <span className="text-lg font-semibold text-white">CampusSafe</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-slate-800 px-5 py-4 text-sm md:block">
          <p className="truncate font-medium text-white">{profile?.name ?? 'Security Office'}</p>
          <p className="truncate text-slate-400">{user?.email}</p>
          <button onClick={() => void logout()} className="mt-3 text-slate-300 underline hover:text-white">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
