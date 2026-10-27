import { collection, limit, orderBy, query, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { IncidentCard } from '../components/IncidentCard'
import { Card, ChoiceChips, EmptyState, Input, PageHeader, Select, Spinner } from '../components/ui'
import { useActiveIncidents } from '../lib/activeIncidents'
import { db } from '../lib/firebase'
import { useCollection, useNow } from '../lib/hooks'
import { compareQueue, incidentLocation, incidentTitle, isEscalatedOpen } from '../lib/incidentLabels'
import { userName, useRefData } from '../lib/refData'
import type { Incident, Priority, WithId } from '../lib/types'

const VIEWS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'responding', label: 'Responding' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
] as const
type View = (typeof VIEWS)[number]['value']

const HISTORY_LIMIT = 300

export function IncidentQueuePage() {
  const [params, setParams] = useSearchParams()
  const view = (VIEWS.find((v) => v.value === params.get('view'))?.value ?? 'active') as View
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<'' | Priority>('')
  const [typeId, setTypeId] = useState('')
  const ref = useRefData()
  const now = useNow()

  const active = useActiveIncidents()
  const historyQuery = useMemo(() => {
    if (view === 'resolved') return query(collection(db, 'incidents'), where('status', '==', 'Resolved'), orderBy('createdAt', 'desc'), limit(HISTORY_LIMIT))
    if (view === 'all') return query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(HISTORY_LIMIT))
    return null
  }, [view])
  const history = useCollection<Incident>(historyQuery)

  const usesHistory = view === 'resolved' || view === 'all'
  const loading = usesHistory ? history.loading : active.loading

  const rows = useMemo(() => {
    let list: WithId<Incident>[] = usesHistory ? history.data : active.incidents
    if (view === 'pending') list = list.filter((i) => i.status === 'Pending')
    if (view === 'responding') list = list.filter((i) => i.status === 'Responding')
    if (view === 'escalated') list = list.filter(isEscalatedOpen)
    if (priority) list = list.filter((i) => i.priority === priority)
    if (typeId) list = list.filter((i) => (typeId === 'sos' ? i.isSOS : i.typeId === typeId && !i.isSOS))
    const term = search.trim().toLowerCase()
    if (term) {
      list = list.filter((i) =>
        [i.description, incidentTitle(i, ref), incidentLocation(i, ref), userName(ref.users, i.reporterId), i.id].join(' ').toLowerCase().includes(term),
      )
    }
    return usesHistory ? list : [...list].sort(compareQueue)
  }, [usesHistory, history.data, active.incidents, view, priority, typeId, search, ref])

  const counts = useMemo(() => {
    const a = active.incidents
    return {
      active: a.length,
      pending: a.filter((i) => i.status === 'Pending').length,
      responding: a.filter((i) => i.status === 'Responding').length,
      escalated: a.filter(isEscalatedOpen).length,
    } as Partial<Record<View, number>>
  }, [active.incidents])

  return (
    <div>
      <PageHeader
        title="Incident reports"
        subtitle={usesHistory ? `Most recent ${HISTORY_LIMIT} reports` : 'Live. Escalated first, then unhandled reports by priority, longest waiting first.'}
      />

      <ChoiceChips options={[...VIEWS]} value={view} onChange={(v) => setParams(v === 'active' ? {} : { view: v })} counts={counts} />

      <div className="mt-[14px] mb-[18px] grid gap-3 sm:grid-cols-[1fr_180px_220px]">
        <Input icon="search" placeholder="Search description, location, reporter…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search incidents" />
        <Select value={priority} onChange={(e) => setPriority(e.target.value as '' | Priority)} aria-label="Filter by priority">
          <option value="">All priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </Select>
        <Select value={typeId} onChange={(e) => setTypeId(e.target.value)} aria-label="Filter by type">
          <option value="">All categories</option>
          <option value="sos">SOS requests</option>
          {[...ref.incidentTypes.values()].map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState icon="inbox" title="No incidents here" body={view === 'active' ? 'All clear. New reports will appear here instantly.' : 'Try another filter.'} />
        </Card>
      ) : (
        rows.map((incident) => <IncidentCard key={incident.id} incident={incident} now={now} />)
      )}
    </div>
  )
}
