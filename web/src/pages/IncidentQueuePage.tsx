import { collection, limit, orderBy, query, where } from 'firebase/firestore'
import { ChevronRight, Image, Inbox, MapPin, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EscalatedBadge, PriorityBadge, SosBadge, StatusBadge } from '../components/badges'
import { Card, EmptyState, Input, PageHeader, Select, Spinner } from '../components/ui'
import { useActiveIncidents } from '../lib/activeIncidents'
import { db } from '../lib/firebase'
import { timeAgo } from '../lib/format'
import { useCollection, useNow } from '../lib/hooks'
import { compareQueue, incidentLocation, incidentTitle, isEscalatedOpen } from '../lib/incidentLabels'
import { userName, useRefData } from '../lib/refData'
import type { Incident, Priority, WithId } from '../lib/types'

const VIEWS = [
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'responding', label: 'Responding' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
] as const
type View = (typeof VIEWS)[number]['id']

const HISTORY_LIMIT = 300

export function IncidentQueuePage() {
  const [params, setParams] = useSearchParams()
  const view = (VIEWS.find((v) => v.id === params.get('view'))?.id ?? 'active') as View
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
        [i.description, incidentTitle(i, ref), incidentLocation(i, ref), userName(ref.users, i.reporterId), i.id]
          .join(' ')
          .toLowerCase()
          .includes(term),
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
        title="Incident Queue"
        subtitle={usesHistory ? `Most recent ${HISTORY_LIMIT} reports` : 'Live. Escalated first, then unhandled reports by priority, longest waiting first.'}
      />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-control border border-line bg-white p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setParams(v.id === 'active' ? {} : { view: v.id })}
            className={`flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-sm whitespace-nowrap transition ${
              view === v.id ? 'bg-navy font-bold text-white' : 'font-medium text-muted hover:bg-background hover:text-ink'
            }`}
          >
            {v.label}
            {counts[v.id] != null && counts[v.id]! > 0 && (
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${view === v.id ? 'bg-white/20' : v.id === 'escalated' ? 'bg-danger text-white' : 'bg-soft-blue text-navy'}`}>
                {counts[v.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input placeholder="Search description, location, reporter…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={priority} onChange={(e) => setPriority(e.target.value as '' | Priority)} aria-label="Filter by priority">
          <option value="">All priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </Select>
        <Select value={typeId} onChange={(e) => setTypeId(e.target.value)} aria-label="Filter by type">
          <option value="">All incident types</option>
          <option value="sos">SOS requests</option>
          {[...ref.incidentTypes.values()].map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon={Inbox} title="No incidents here" body={view === 'active' ? 'All clear. New reports will appear here instantly.' : 'Try another view or clear the filters.'} />
        ) : (
          <>
            <div className="hidden grid-cols-[110px_1fr_200px_150px_120px_24px] gap-4 border-b border-line bg-background px-5 py-3 text-xs font-bold tracking-wide text-muted uppercase md:grid">
              <span>Priority</span>
              <span>Incident</span>
              <span>Location</span>
              <span>Reported</span>
              <span>Status</span>
              <span />
            </div>
            <ul className="divide-y divide-line">
              {rows.map((incident) => (
                <IncidentRow key={incident.id} incident={incident} now={now} />
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  )
}

export function IncidentRow({ incident, now, compact }: { incident: WithId<Incident>; now: number; compact?: boolean }) {
  const ref = useRefData()
  const responder = incident.assignedResponderId ? userName(ref.users, incident.assignedResponderId) : null
  const escalated = isEscalatedOpen(incident)
  const badges = (
    <div className="flex flex-wrap gap-1.5">
      <PriorityBadge priority={incident.priority} />
      {incident.isSOS && <SosBadge />}
    </div>
  )
  const title = (
    <div className="flex min-w-0 items-center gap-2">
      <p className="truncate font-bold">{incidentTitle(incident, ref)}</p>
      {escalated && <EscalatedBadge />}
      {incident.photoUrls?.length > 0 && <Image className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Has photos" />}
    </div>
  )
  const rowClass = `transition hover:bg-soft-blue/50 ${escalated ? 'border-l-4 border-l-danger' : ''}`

  if (compact) {
    return (
      <li>
        <Link to={`/incidents/${incident.id}`} className={`flex items-start gap-4 px-5 py-4 ${rowClass}`}>
          <div className="w-[88px] shrink-0 pt-0.5">{badges}</div>
          <div className="min-w-0 flex-1">
            {title}
            <p className="truncate text-sm text-muted">{incident.description || 'No description'}</p>
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
              <MapPin className="h-3 w-3 shrink-0" /> {incidentLocation(incident, ref)} · {timeAgo(incident.createdAt, now)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <StatusBadge status={incident.status} />
            {responder && <p className="mt-1 max-w-28 truncate text-xs text-muted">→ {responder}</p>}
          </div>
        </Link>
      </li>
    )
  }

  return (
    <li>
      <Link
        to={`/incidents/${incident.id}`}
        className={`grid gap-2 px-5 py-4 md:grid-cols-[110px_1fr_200px_150px_120px_24px] md:items-center md:gap-4 ${rowClass}`}
      >
        {badges}
        <div className="min-w-0">
          {title}
          <p className="truncate text-sm text-muted">{incident.description || 'No description'}</p>
        </div>
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted md:text-ink">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
          <span className="truncate">{incidentLocation(incident, ref)}</span>
        </p>
        <div className="text-sm">
          <p className="font-medium">{timeAgo(incident.createdAt, now)}</p>
          <p className="truncate text-xs text-muted">{userName(ref.users, incident.reporterId)}</p>
        </div>
        <div>
          <StatusBadge status={incident.status} />
          {responder && <p className="mt-1 truncate text-xs text-muted">→ {responder}</p>}
        </div>
        <ChevronRight className="hidden h-4 w-4 text-muted md:block" />
      </Link>
    </li>
  )
}
