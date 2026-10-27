import {
  BarChart3,
  Bell,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Settings,
  Siren,
  Tags,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { logout, useAuth } from '../auth/useAuth'
import { Button, Logo, Modal } from '../components/ui'
import { useActiveIncidents } from '../lib/activeIncidents'
import { isEscalatedOpen } from '../lib/incidentLabels'
import { LiveProviders } from './LiveProviders'

const NAV = [
  { section: 'Monitor' },
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/incidents', label: 'Incident Queue', icon: Siren, badge: 'pending' as const },
  { to: '/alerts', label: 'Broadcast Alerts', icon: Megaphone },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { section: 'Manage' },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/incident-types', label: 'Incident Types', icon: Tags },
  { to: '/location-tags', label: 'Location Tags', icon: MapPin },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function DashboardLayout() {
  return (
    <LiveProviders>
      <Shell />
    </LiveProviders>
  )
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    // Close the mobile menu after navigating.
    setLastPath(location.pathname)
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button className="rounded-lg p-1 text-muted lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <SideNav />
        <UserCard />
      </aside>
      {menuOpen && <div className="no-print fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <TopBar onMenu={() => setMenuOpen(true)} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}

function SideNav() {
  const { incidents } = useActiveIncidents()
  const pending = incidents.filter((i) => i.status === 'Pending').length

  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4">
      {NAV.map((item, i) =>
        'section' in item ? (
          <p key={i} className="px-3 pt-5 pb-2 text-[11px] font-bold tracking-wider text-muted uppercase">
            {item.section}
          </p>
        ) : (
          <NavLink
            key={item.to}
            to={item.to!}
            end={item.end}
            className={({ isActive }) =>
              `mb-0.5 flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-soft-blue font-bold text-navy' : 'text-ink hover:bg-background'
              }`
            }
          >
            {({ isActive }) => {
              const Icon = item.icon!
              return (
                <>
                  <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-blue' : 'text-muted'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge === 'pending' && pending > 0 && (
                    <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-bold text-white">{pending}</span>
                  )}
                </>
              )
            }}
          </NavLink>
        ),
      )}
    </nav>
  )
}

function UserCard() {
  const { user, profile } = useAuth()
  const [confirm, setConfirm] = useState(false)
  const name = profile?.name ?? 'Security Office'
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="border-t border-line p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{name}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
        </div>
        <button onClick={() => setConfirm(true)} className="rounded-lg p-2 text-muted hover:bg-background hover:text-ink" aria-label="Log out" title="Log out">
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
      <Modal
        open={confirm}
        title="Log out"
        onClose={() => setConfirm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button onClick={() => void logout()}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm">Are you sure you want to log out? You will stop receiving live incident alerts on this computer.</p>
      </Modal>
    </div>
  )
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { incidents, loading } = useActiveIncidents()
  const escalated = incidents.filter(isEscalatedOpen).length
  const high = incidents.filter((i) => i.priority === 'High' && i.status === 'Pending').length

  return (
    <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button className="rounded-lg p-2 text-ink lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <div className="lg:hidden">
        <Logo compact />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="relative flex h-2.5 w-2.5">
          {!loading && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${loading ? 'bg-muted' : 'bg-success'}`} />
        </span>
        <span className="hidden font-medium text-muted sm:inline">{loading ? 'Connecting…' : 'Live monitoring'}</span>
      </div>
      <div className="flex-1" />
      {escalated > 0 && (
        <Link to="/incidents?view=escalated" className="flex items-center gap-1.5 rounded-full bg-danger px-3 py-1.5 text-xs font-bold text-white">
          <Bell className="h-3.5 w-3.5" /> {escalated} escalated
        </Link>
      )}
      <Link
        to="/incidents"
        className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold hover:bg-soft-blue"
      >
        <ListChecks className="h-3.5 w-3.5 text-blue" />
        <span>{high} high priority pending</span>
      </Link>
    </header>
  )
}
