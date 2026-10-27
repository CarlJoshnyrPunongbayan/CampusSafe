import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { logout } from '../auth/useAuth'
import { Icon } from '../components/Icon'
import { Button, IconButton, Logo, Modal } from '../components/ui'
import { useActiveIncidents } from '../lib/activeIncidents'
import { isEscalatedOpen } from '../lib/incidentLabels'
import { LiveProviders } from './LiveProviders'
import { NAV } from './nav'

export function DashboardLayout() {
  return (
    <LiveProviders>
      <Shell />
    </LiveProviders>
  )
}

function Shell() {
  return (
    <div className="min-h-screen pb-[68px] lg:pb-0 lg:pl-[88px]">
      <CampusAppBar />
      <NavigationRail />
      <main className="mx-auto max-w-6xl px-5 py-5 lg:px-8 lg:py-7">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}

/** CampusAppBar with showActions: logo, then alerts, profile and log out. */
function CampusAppBar() {
  const { incidents, loading } = useActiveIncidents()
  const [confirm, setConfirm] = useState(false)
  const pendingHigh = incidents.filter((i) => i.status === 'Pending' && (i.priority === 'High' || isEscalatedOpen(i))).length

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-background/95 px-4 backdrop-blur lg:-ml-[88px] lg:pl-6">
      <Logo subtitle="Security Office" />
      <div className="ml-4 hidden items-center gap-2 text-xs font-medium text-muted sm:flex">
        <span className={`h-2 w-2 rounded-full ${loading ? 'bg-muted' : 'bg-success'}`} />
        {loading ? 'Connecting…' : 'Live monitoring'}
      </div>
      <div className="flex-1" />
      <IconButton icon="notifications" label={`${pendingHigh} high priority reports waiting`} to="/incidents?view=pending" badge={pendingHigh} />
      <IconButton icon="person" label="Profile" to="/profile" />
      <IconButton icon="logout" label="Log out" onClick={() => setConfirm(true)} />
      <LogoutDialog open={confirm} onClose={() => setConfirm(false)} />
    </header>
  )
}

/** Same dialog as CampusAppBar.showLogout in the app. */
export function LogoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      title="Log out"
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button variant="filled" onClick={() => void logout()}>Confirm</Button>
        </>
      }
    >
      <p className="text-muted">Are you sure you want to log out?</p>
    </Modal>
  )
}

function usePendingCount() {
  const { incidents } = useActiveIncidents()
  return incidents.filter((i) => i.status === 'Pending').length
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return <span className="absolute -top-1 left-1/2 ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{count}</span>
}

/** Material 3 NavigationRail: white, soft-blue pill indicator, filled icon when selected. */
function NavigationRail() {
  const pending = usePendingCount()
  return (
    <nav className="no-print fixed top-16 bottom-0 left-0 z-20 hidden w-[88px] flex-col items-center gap-1 overflow-y-auto border-r border-line bg-white py-4 lg:flex" aria-label="Main">
      {NAV.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className="group flex w-full flex-col items-center gap-1 py-1">
          {({ isActive }) => (
            <>
              <span className={`relative flex h-8 w-14 items-center justify-center rounded-2xl transition ${isActive ? 'bg-soft-blue' : 'group-hover:bg-ink/5'}`}>
                <Icon name={item.icon} filled={isActive} className={isActive ? 'text-navy' : 'text-muted'} />
                {item.badge && <Badge count={pending} />}
              </span>
              <span className={`text-xs font-semibold ${isActive ? 'text-ink' : 'text-muted'}`}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

const MORE_PATHS = ['/more', '/profile', ...NAV.filter((n) => !n.primary).map((n) => n.to)]

/** CampusBottomNavigation: white NavigationBar, height 68, soft-blue indicator. */
function BottomNavigation() {
  const pending = usePendingCount()
  const { pathname } = useLocation()
  const items = [...NAV.filter((n) => n.primary), { to: '/more', label: 'More', icon: 'menu', end: false, badge: false }]

  return (
    <nav className="no-print fixed right-0 bottom-0 left-0 z-30 flex h-[68px] border-t border-line bg-white lg:hidden" aria-label="Main">
      {items.map((item) => {
        const forceActive = item.to === '/more' && MORE_PATHS.some((p) => pathname.startsWith(p))
        return (
          <NavLink key={item.to} to={item.to} end={item.end} className="flex flex-1 flex-col items-center justify-center gap-1">
            {({ isActive }) => {
              const active = isActive || forceActive
              return (
                <>
                  <span className={`relative flex h-8 w-16 items-center justify-center rounded-2xl ${active ? 'bg-soft-blue' : ''}`}>
                    <Icon name={item.icon} filled={active} className={active ? 'text-navy' : 'text-muted'} />
                    {item.badge && <Badge count={pending} />}
                  </span>
                  <span className={`text-xs font-semibold ${active ? 'text-ink' : 'text-muted'}`}>{item.label}</span>
                </>
              )
            }}
          </NavLink>
        )
      })}
    </nav>
  )
}
