import { httpsCallable } from 'firebase/functions'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { RoleBadge } from '../components/badges'
import { Avatar, Button, Card, ChoiceChips, EmptyState, Input, Modal, PageHeader, Select, Spinner } from '../components/ui'
import { functions } from '../lib/firebase'
import { formatDate } from '../lib/format'
import { useRefData } from '../lib/refData'
import { useToast } from '../lib/toast'
import type { Role, UserProfile, WithId } from '../lib/types'

const setUserRole = httpsCallable<{ uid: string; role: Role }, { uid: string; role: Role }>(functions, 'setUserRole')

const ROLE_INFO: Record<Role, string> = {
  student: 'Can report incidents, send SOS and receive alerts in the mobile app.',
  responder: 'Sees incidents assigned to them in the mobile app and updates their status.',
  admin: 'Full access to this dashboard: incidents, alerts, users and settings.',
}
const ROLE_ICON: Record<Role, { icon: string; tone: 'blue' | 'success' | 'navy' }> = {
  student: { icon: 'school', tone: 'blue' },
  responder: { icon: 'security', tone: 'success' },
  admin: { icon: 'admin_panel_settings', tone: 'navy' },
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'student', label: 'Students' },
  { value: 'responder', label: 'Responders' },
  { value: 'admin', label: 'Admins' },
] as const
type Filter = (typeof FILTERS)[number]['value']

export function UsersPage() {
  const { user } = useAuth()
  const { users, loading } = useRefData()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [pending, setPending] = useState<{ user: WithId<UserProfile>; role: Role } | null>(null)
  const [saving, setSaving] = useState(false)

  const all = [...users.values()]
  const list = useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...users.values()]
      .filter((u) => filter === 'all' || u.role === filter)
      .filter((u) => !term || [u.name, u.email, u.studentId, u.mobileNo].join(' ').toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [users, search, filter])

  const counts = { all: all.length, student: all.filter((u) => u.role === 'student').length, responder: all.filter((u) => u.role === 'responder').length, admin: all.filter((u) => u.role === 'admin').length }

  async function confirmRole() {
    if (!pending) return
    setSaving(true)
    try {
      await setUserRole({ uid: pending.user.id, role: pending.role })
      toast({ tone: 'success', title: `${pending.user.name} is now a ${pending.role}` })
      setPending(null)
    } catch (err) {
      toast({ tone: 'error', title: 'Role not changed', body: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Users" subtitle="Choose who responds to incidents and who can use this dashboard." />
      <ChoiceChips options={[...FILTERS]} value={filter} onChange={setFilter} counts={counts} />
      <div className="mt-[14px] mb-[18px]">
        <Input icon="search" placeholder="Search name, email, student ID, phone…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
      </div>

      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <Card><EmptyState icon="group" title="No users found" /></Card>
      ) : (
        list.map((u) => {
          const self = u.id === user?.uid
          return (
            <Card key={u.id} className="mb-2.5">
              <div className="flex flex-wrap items-center gap-4 px-4 py-3">
                <Avatar icon={ROLE_ICON[u.role].icon} tone={ROLE_ICON[u.role].tone} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold">
                    {u.name} {self && <span className="text-sm font-normal text-muted">(you)</span>}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {u.email}
                    {u.studentId && ` • ${u.studentId}`}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {u.mobileNo && (
                      <a href={`tel:${u.mobileNo}`} className="text-navy hover:underline">{u.mobileNo}</a>
                    )}
                    {u.mobileNo && ' · '}Joined {formatDate(u.createdAt)}
                  </p>
                </div>
                <RoleBadge role={u.role} />
                <Select
                  value={u.role}
                  disabled={self}
                  onChange={(e) => setPending({ user: u, role: e.target.value as Role })}
                  className="!h-10 !w-36"
                  aria-label={`Role for ${u.name}`}
                >
                  <option value="student">Student</option>
                  <option value="responder">Responder</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
            </Card>
          )
        })
      )}

      <Modal
        open={!!pending}
        title="Change role?"
        onClose={() => setPending(null)}
        footer={
          <>
            <Button variant="text" onClick={() => setPending(null)}>Cancel</Button>
            <Button variant="filled" loading={saving} onClick={confirmRole}>Confirm</Button>
          </>
        }
      >
        {pending && (
          <div className="space-y-3">
            <p>
              Change <b>{pending.user.name}</b> from <RoleBadge role={pending.user.role} /> to <RoleBadge role={pending.role} />?
            </p>
            <p className="text-muted">{ROLE_INFO[pending.role]}</p>
            <p className="text-xs text-muted">The change applies to their app within a few seconds.</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
