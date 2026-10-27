import { collection, limit, orderBy, query, where, Timestamp } from 'firebase/firestore'
import { AlertTriangle, CheckCircle2, Clock, Megaphone, ShieldCheck, Siren, Timer } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { SeverityBadge } from '../components/badges'
import { Banner, Card, CardHeader, EmptyState, IconTile, PageHeader, Spinner, StatCard } from '../components/ui'
import { useActiveIncidents } from '../lib/activeIncidents'
import { db } from '../lib/firebase'
import { average, durationBetween, formatDuration, timeAgo } from '../lib/format'
import { useCollection, useNow } from '../lib/hooks'
import { compareQueue, isEscalatedOpen } from '../lib/incidentLabels'
import type { Alert, Incident } from '../lib/types'
import { IncidentRow } from './IncidentQueuePage'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return Timestamp.fromDate(d)
}

export function OverviewPage() {
  const { profile } = useAuth()
  const now = useNow()
  const { incidents: active, loading } = useActiveIncidents()

  const todayQ = useMemo(() => query(collection(db, 'incidents'), where('createdAt', '>=', startOfToday())), [])
  const today = useCollection<Incident>(todayQ)
  const alertsQ = useMemo(() => query(collection(db, 'alerts'), orderBy('sentAt', 'desc'), limit(4)), [])
  const alerts = useCollection<Alert>(alertsQ)

  const pending = active.filter((i) => i.status === 'Pending')
  const highPending = pending.filter((i) => i.priority === 'High')
  const escalated = active.filter(isEscalatedOpen)
  const resolvedToday = today.data.filter((i) => i.status === 'Resolved').length
  const avgAck = average(today.data.map((i) => durationBetween(i.createdAt, i.acknowledgedAt)))
  const queue = [...active].sort(compareQueue).slice(0, 6)

  const firstName = profile?.name?.split(' ')[0]

  return (
    <div>
      <PageHeader title={`Welcome back${firstName ? `, ${firstName}` : ''}`} subtitle="Here is what is happening on campus right now." />

      <div className="mb-6">
        {escalated.length > 0 ? (
          <Banner
            tone="danger"
            icon={AlertTriangle}
            title={`${escalated.length} escalated report${escalated.length > 1 ? 's' : ''} need${escalated.length > 1 ? '' : 's'} acknowledgement`}
            body="High-priority reports that were not acknowledged in time."
            action={<Link to="/incidents?view=escalated" className="rounded-control bg-danger px-3 py-2 text-sm font-bold text-white">Review</Link>}
          />
        ) : (
          <Banner icon={ShieldCheck} title="Campus safety is connected" body="Live monitoring is on. New reports and SOS requests will alert you instantly." />
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Siren} tone="danger" label="Pending reports" value={loading ? '…' : pending.length} hint={`${highPending.length} high priority`} />
        <StatCard icon={Clock} tone="warning" label="Responding" value={loading ? '…' : active.length - pending.length} hint="Responder on the way" />
        <StatCard icon={CheckCircle2} tone="success" label="Resolved today" value={today.loading ? '…' : resolvedToday} hint={`${today.data.length} reported today`} />
        <StatCard icon={Timer} tone="blue" label="Avg. time to acknowledge" value={today.loading ? '…' : formatDuration(avgAck)} hint="Reports received today" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader
            title="Needs attention"
            subtitle="Active reports in queue order"
            action={<Link to="/incidents" className="text-sm font-bold text-blue hover:underline">View all</Link>}
          />
          {loading ? (
            <Spinner />
          ) : queue.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No active incidents" body="All reports have been resolved." />
          ) : (
            <ul className="divide-y divide-line">
              {queue.map((i) => (
                <IncidentRow key={i.id} incident={i} now={now} compact />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent alerts"
            action={<Link to="/alerts" className="text-sm font-bold text-blue hover:underline">Broadcast</Link>}
          />
          {alerts.loading ? (
            <Spinner />
          ) : alerts.data.length === 0 ? (
            <EmptyState icon={Megaphone} title="No alerts sent yet" />
          ) : (
            <ul className="divide-y divide-line">
              {alerts.data.map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-4">
                  <IconTile icon={Megaphone} size="sm" tone={a.severity === 'Emergency' ? 'danger' : a.severity === 'Warning' ? 'warning' : 'blue'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold">{a.title}</p>
                      <SeverityBadge severity={a.severity} />
                    </div>
                    <p className="line-clamp-2 text-sm text-muted">{a.body}</p>
                    <p className="mt-1 text-xs text-muted">{timeAgo(a.sentAt, now)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
