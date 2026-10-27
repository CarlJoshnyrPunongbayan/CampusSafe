import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { Icon } from '../components/Icon'
import { Button, InfoCard } from '../components/ui'
import { LogoutDialog } from '../layout/DashboardLayout'
import { formatDate } from '../lib/format'
import { useRefData } from '../lib/refData'

/** The app's ProfileScreen: avatar, name, role, info cards, log out button. */
export function ProfilePage() {
  const { user, profile, role } = useAuth()
  const { config } = useRefData()
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex flex-col items-center">
        <span className="flex h-[108px] w-[108px] items-center justify-center rounded-full bg-secondary-container text-navy">
          <Icon name="person" filled size={62} />
        </span>
        <p className="mt-3.5 text-[22px] font-bold">{profile?.name ?? 'Security Office'}</p>
        <p className="capitalize">{role === 'admin' ? 'Security office admin' : role}</p>
      </div>
      <div className="mt-5 space-y-3">
        <InfoCard title="Contact information" rows={[['Email', user?.email ?? '—'], ['Phone', profile?.mobileNo || '—']]} />
        <InfoCard title="Account" rows={[['Role', 'Admin (web dashboard)'], ['Member since', formatDate(profile?.createdAt)]]} />
        <InfoCard title="Security office" rows={[['Hotline', config.securityHotline || 'Not set'], ['Escalation after', `${config.escalationMinutes ?? 2} minutes`]]} />
      </div>
      <Button size="lg" className="mt-[14px] w-full" onClick={() => setConfirm(true)}>Log out</Button>
      <LogoutDialog open={confirm} onClose={() => setConfirm(false)} />
    </div>
  )
}
