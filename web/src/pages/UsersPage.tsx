import { httpsCallable } from 'firebase/functions'
import { Phone, Search, ShieldCheck, Truck, UserRound, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { RoleBadge } from '../components/badges'
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select, Spinner, StatCard } from '../components/ui'
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

export function UsersPage() {
  const { user } = useAuth()
  const { users, loading } = useRefData()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'' | Role>('')
  const [pending, setPending] = useState<{ user: WithId<UserProfile>; role: Role } | null>(null)
  const [saving, setSaving] = useState(false)

  const list = useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...users.values()]
      .filter((u) => !roleFilter || u.role === roleFilter)
      .filter((u) => !term || [u.name, u.email, u.studentId, u.mobileNo].join(' ').toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [users, search, roleFilter])

  const count = (role: Role) => [...users.values()].filter((u) => u.role === role).length

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
      <PageHeader title="Users" subtitle="Manage who can respond to incidents and who can use this dashboard." />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard icon={UserRound} label="Students" value={loading ? '…' : count('student')} />
        <StatCard icon={Truck} tone="warning" label="Responders" value={loading ? '…' : count('responder')} />
        <StatCard icon={ShieldCheck} tone="navy" label="Admins" value={loading ? '…' : count('admin')} />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input placeholder="Search name, email, student ID, mobile…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as '' | Role)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="responder">Responders</option>
          <option value="admin">Admins</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : list.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line bg-background text-left text-xs font-bold tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Student ID</th>
                  <th className="px-5 py-3">Mobile</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Change role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((u) => (
                  <tr key={u.id} className="hover:bg-soft-blue/40">
                    <td className="px-5 py-3">
                      <p className="font-bold">{u.name}{u.id === user?.uid && <span className="ml-1 text-xs font-medium text-muted">(you)</span>}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">{u.studentId ?? '—'}</td>
                    <td className="px-5 py-3">
                      {u.mobileNo ? (
                        <a href={`tel:${u.mobileNo}`} className="inline-flex items-center gap-1 text-blue hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {u.mobileNo}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3">
                      <Select
                        value={u.role}
                        disabled={u.id === user?.uid}
                        onChange={(e) => setPending({ user: u, role: e.target.value as Role })}
                        className="!h-9 w-36"
                        aria-label={`Role for ${u.name}`}
                      >
                        <option value="student">Student</option>
                        <option value="responder">Responder</option>
                        <option value="admin">Admin</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!pending}
        title="Change role"
        onClose={() => setPending(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
            <Button loading={saving} onClick={confirmRole}>Confirm</Button>
          </>
        }
      >
        {pending && (
          <div className="space-y-3 text-sm">
            <p>
              Change <b>{pending.user.name}</b> from <RoleBadge role={pending.user.role} /> to <RoleBadge role={pending.role} />?
            </p>
            <p className="rounded-control bg-background px-4 py-3 text-muted">{ROLE_INFO[pending.role]}</p>
            <p className="text-xs text-muted">The change applies to their app within a few seconds.</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
