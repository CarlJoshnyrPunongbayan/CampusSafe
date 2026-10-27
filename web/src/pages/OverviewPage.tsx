import { collection, limit, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { useMemo } from 'react'
import { useAuth } from '../auth/useAuth'
import { AlertCard } from '../components/AlertCard'
import { IncidentCard } from '../components/IncidentCard'
import { Banner, Card, EmptyState, FeatureCard, InfoCard, SectionHeader, Spinner } from '../components/ui'
import { useActiveIncidents } from '../lib/activeIncidents'
import { db } from '../lib/firebase'
import { average, durationBetween, formatDuration, timeAgo } from '../lib/format'
import { useCollection, useNow } from '../lib/hooks'
import { compareQueue, isEscalatedOpen } from '../lib/incidentLabels'
import { userName, useRefData } from '../lib/refData'
import type { Alert, Incident } from '../lib/types'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return Timestamp.fromDate(d)
}

/** Laid out like the app's HomeScreen: greeting, soft-blue banner, 2×2 feature cards, recent reports. */
export function OverviewPage() {
  const { profile } = useAuth()
  const ref = useRefData()
  const now = useNow()
  const { incidents: active, loading } = useActiveIncidents()

  const todayQ = useMemo(() => query(collection(db, 'incidents'), where('createdAt', '>=', startOfToday())), [])
  const today = useCollection<Incident>(todayQ)
  const alertsQ = useMemo(() => query(collection(db, 'alerts'), orderBy('sentAt', 'desc'), limit(3)), [])
  const alerts = useCollection<Alert>(alertsQ)

  const pending = active.filter((i) => i.status === 'Pending')
  const urgent = pending.filter((i) => i.isSOS || i.priority === 'High')
  const escalated = active.filter(isEscalatedOpen)
  const avgAck = average(today.data.map((i) => durationBetween(i.createdAt, i.acknowledgedAt)))
  const queue = [...active].sort(compareQueue).slice(0, 5)
  const firstName = profile?.name?.split(' ')[0] ?? 'Officer'
  const count = (n: number) => (loading ? '…' : n)

  return (
    <div>
      <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.5px]">Welcome back, {firstName}</h1>
      <p className="mt-[5px] text-muted">Here is what is happening on campus right now.</p>

      <div className="mt-[18px]">
        {escalated.length > 0 ? (
          <Banner
            tone="danger"
            icon="warning_amber"
            title={`${escalated.length} escalated report${escalated.length > 1 ? 's' : ''} not yet acknowledged`}
            body="High-priority reports waiting longer than the escalation time. Open them now."
          />
        ) : (
          <Banner icon="verified_user" title="Campus safety is connected" body="Live monitoring is on. New reports and SOS requests alert you instantly." />
        )}
      </div>

      <div className="mt-[18px] grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FeatureCard to="/incidents?view=pending" icon="report" tone="blue" title="Pending reports" subtitle="Waiting for acknowledgement" value={count(pending.length)} />
        <FeatureCard to="/incidents?view=pending" icon="sos" tone="danger" title="SOS / high priority" subtitle="Urgent reports waiting now" value={count(urgent.length)} />
        <FeatureCard to="/alerts" icon="notifications_active" tone="warning" title="Broadcast alert" subtitle="Send a campus-wide update" />
        <FeatureCard to="/map" icon="map" tone="success" title="Campus map" subtitle="Where active incidents are" />
      </div>

      <div className="mt-[26px] grid gap-6 lg:grid-cols-3">
        <section className="min-w-0 lg:col-span-2">
          <SectionHeader title="Needs attention" action="View all" to="/incidents" />
          {loading ? (
            <Spinner />
          ) : queue.length === 0 ? (
            <Card><EmptyState icon="verified_user" title="No active incidents" body="All reports have been resolved." /></Card>
          ) : (
            queue.map((i) => <IncidentCard key={i.id} incident={i} now={now} />)
          )}
        </section>

        <section className="min-w-0">
          <SectionHeader title="Today" />
          <InfoCard
            title="Response summary"
            rows={[
              ['Reports received', today.loading ? '…' : today.data.length],
              ['Resolved', today.loading ? '…' : today.data.filter((i) => i.status === 'Resolved').length],
              ['Responding now', count(active.length - pending.length)],
              ['Avg. time to acknowledge', today.loading ? '…' : formatDuration(avgAck)],
            ]}
          />
          <div className="mt-[26px]">
            <SectionHeader title="Recent alerts" action="View all" to="/alerts" />
            {alerts.loading ? (
              <Spinner />
            ) : alerts.data.length === 0 ? (
              <Card><EmptyState icon="notifications" title="No alerts sent yet" /></Card>
            ) : (
              alerts.data.map((a) => <AlertCard key={a.id} title={a.title} meta={`${userName(ref.users, a.sentBy)} • ${timeAgo(a.sentAt, now)}`} severity={a.severity} />)
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
