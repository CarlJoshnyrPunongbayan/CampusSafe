import { collection, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button, Card, CardHeader, EmptyState, FeatureCard, PageHeader, Select, Spinner } from '../components/ui'
import { db } from '../lib/firebase'
import { average, durationBetween, formatDuration, toDate } from '../lib/format'
import { useCollection } from '../lib/hooks'
import { incidentLocation, incidentTitle } from '../lib/incidentLabels'
import { userName, useRefData } from '../lib/refData'
import type { Incident, Priority } from '../lib/types'

const RANGES = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
]

// Chart tokens: brand blue for single series; priority colors match the badges (validated for CVD).
const C = {
  series: '#356CC8',
  grid: '#E5E8EE',
  axis: '#68748A',
  priority: { High: '#D94B50', Medium: '#E69B2D', Low: '#356CC8' } as Record<Priority, string>,
}

interface Metric {
  kind: string
  value: number
  recordedAt: Timestamp
}

function dayKey(d: Date) {
  return d.toLocaleDateString('en-CA')
}

export function AnalyticsPage() {
  const ref = useRefData()
  const [days, setDays] = useState(30)
  // Fixed when the page opens, so the live queries are not re-created on every render.
  const [now] = useState(() => Date.now())
  const since = useMemo(() => Timestamp.fromMillis(now - days * 86_400_000), [now, days])

  const incidentsQ = useMemo(() => query(collection(db, 'incidents'), where('createdAt', '>=', since), orderBy('createdAt', 'desc')), [since])
  const metricsQ = useMemo(() => query(collection(db, 'metrics'), where('recordedAt', '>=', since)), [since])
  const { data: incidents, loading } = useCollection<Incident>(incidentsQ)
  const { data: metrics } = useCollection<Metric>(metricsQ)

  const stats = useMemo(() => {
    const target = (ref.config.escalationMinutes ?? 2) * 60_000
    const ackTimes = incidents.map((i) => durationBetween(i.createdAt, i.acknowledgedAt))
    const resolveTimes = incidents.map((i) => durationBetween(i.createdAt, i.resolvedAt))
    const high = incidents.filter((i) => i.priority === 'High')
    const highAckOnTime = high.filter((i) => {
      const t = durationBetween(i.createdAt, i.acknowledgedAt)
      return t != null && t <= target
    }).length

    // Reports per day, including days with zero reports.
    const perDay = new Map<string, number>()
    // The range starts `days` × 24 h ago, so it touches days + 1 calendar days.
    for (let d = days; d >= 0; d--) perDay.set(dayKey(new Date(now - d * 86_400_000)), 0)
    for (const i of incidents) {
      const d = toDate(i.createdAt)
      if (d) perDay.set(dayKey(d), (perDay.get(dayKey(d)) ?? 0) + 1)
    }

    const count = <K extends string>(keyOf: (i: Incident) => K) => {
      const m = new Map<K, number>()
      for (const i of incidents) m.set(keyOf(i), (m.get(keyOf(i)) ?? 0) + 1)
      return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    }

    const priorities: Priority[] = ['High', 'Medium', 'Low']
    const display = metrics.filter((m) => m.kind === 'dashboard_display_ms').map((m) => m.value)

    return {
      total: incidents.length,
      resolved: incidents.filter((i) => i.status === 'Resolved').length,
      avgAck: average(ackTimes),
      avgResolve: average(resolveTimes),
      highCount: high.length,
      highAckRate: high.length ? Math.round((highAckOnTime / high.length) * 100) : null,
      target,
      perDay: [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({
        date,
        label: new Date(`${date}T00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        value,
      })),
      byType: count((i) => incidentTitle(i, ref)).slice(0, 8),
      byPriority: priorities.map((p) => ({ name: p, value: incidents.filter((i) => i.priority === p).length })),
      ackByPriority: priorities.map((p) => ({
        name: p,
        value: average(incidents.filter((i) => i.priority === p).map((i) => durationBetween(i.createdAt, i.acknowledgedAt))),
      })),
      byLocation: count((i) => (i.locationTagId && ref.locationTags.has(i.locationTagId) ? incidentLocation(i, ref) : 'GPS only (no QR tag)')).slice(0, 6),
      display: {
        n: display.length,
        avg: average(display),
        within: display.length ? Math.round((display.filter((v) => v <= 5000).length / display.length) * 100) : null,
      },
    }
  }, [incidents, metrics, days, ref, now])

  function exportCsv() {
    const header = ['id', 'type', 'sos', 'priority', 'status', 'location', 'reporter', 'reported_at', 'acknowledged_at', 'responding_at', 'resolved_at', 'ack_seconds', 'resolve_seconds', 'escalated', 'description']
    const iso = (t: Incident['createdAt'] | undefined) => toDate(t)?.toISOString() ?? ''
    const secs = (ms: number | null) => (ms == null ? '' : Math.round(ms / 1000))
    const rows = incidents.map((i) => [
      i.id,
      incidentTitle(i, ref),
      i.isSOS,
      i.priority ?? '',
      i.status,
      incidentLocation(i, ref),
      userName(ref.users, i.reporterId),
      iso(i.createdAt),
      iso(i.acknowledgedAt),
      iso(i.respondingAt),
      iso(i.resolvedAt),
      secs(durationBetween(i.createdAt, i.acknowledgedAt)),
      secs(durationBetween(i.createdAt, i.resolvedAt)),
      !!i.escalated,
      i.description,
    ])
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `campussafe-incidents-${dayKey(new Date())}-${days}d.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Response-time tracking and incident patterns for data-driven decisions."
        actions={
          <>
            <Select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Date range" className="!w-44">
              {RANGES.map((r) => (
                <option key={r.days} value={r.days}>{r.label}</option>
              ))}
            </Select>
            <Button variant="outlined" icon="download" className="!h-[50px]" onClick={exportCsv} disabled={incidents.length === 0}>Export CSV</Button>
          </>
        }
      />

      {loading ? (
        <Spinner />
      ) : incidents.length === 0 ? (
        <Card><EmptyState icon="insights" title="No reports in this period" body="Choose a longer date range." /></Card>
      ) : (
        <>
          <div className="mb-[18px] grid grid-cols-2 gap-3 lg:grid-cols-4">
            <FeatureCard icon="insights" title="Total reports" value={stats.total} subtitle={`${stats.resolved} resolved`} />
            <FeatureCard icon="timer" tone="warning" title="Avg. time to acknowledge" value={formatDuration(stats.avgAck)} subtitle="Report received → acknowledged" />
            <FeatureCard icon="task_alt" tone="success" title="Avg. time to resolve" value={formatDuration(stats.avgResolve)} subtitle="Report received → resolved" />
            <FeatureCard
              icon="speed"
              tone="danger"
              title="High priority on time"
              value={stats.highAckRate == null ? '—' : `${stats.highAckRate}%`}
              subtitle={`Acknowledged within ${formatDuration(stats.target)} (${stats.highCount} High)`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader title="Reports per day" subtitle={RANGES.find((r) => r.days === days)?.label} />
              <div className="h-64 px-2 py-4">
                <ResponsiveContainer>
                  <BarChart data={stats.perDay} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={C.grid} />
                    <XAxis dataKey="label" tick={{ fill: C.axis, fontSize: 12 }} tickLine={false} axisLine={{ stroke: C.grid }} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fill: C.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#EAF1FC' }} content={<ChartTooltip unit="reports" />} />
                    <Bar dataKey="value" fill={C.series} radius={[4, 4, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Reports by incident type" subtitle="Top 8" />
              <HorizontalBars data={stats.byType} />
            </Card>

            <Card>
              <CardHeader title="Reports by priority" subtitle="After officer confirmation" />
              <HorizontalBars data={stats.byPriority} colorOf={(name) => C.priority[name as Priority]} />
              <div className="border-t border-line px-4 py-4">
                <p className="mb-2 text-sm font-bold">Average time to acknowledge</p>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  {stats.ackByPriority.map((p) => (
                    <div key={p.name} className="rounded-control bg-soft-blue px-2 py-2.5">
                      <dt className="flex items-center justify-center gap-1.5 text-xs text-muted">
                        <span className="h-2 w-2 rounded-full" style={{ background: C.priority[p.name] }} />
                        {p.name}
                      </dt>
                      <dd className="mt-0.5 font-bold">{formatDuration(p.value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Card>

            <Card>
              <CardHeader title="Top locations" subtitle="Where reports come from" />
              <HorizontalBars data={stats.byLocation} />
            </Card>

            <Card>
              <CardHeader title="System performance" subtitle="Measured automatically for the evaluation (Table XII)" />
              <dl className="divide-y divide-line">
                <PerfRow label="Report to dashboard display (avg.)" value={stats.display.avg == null ? '—' : formatDuration(stats.display.avg)} target="Target ≤ 5s" />
                <PerfRow label="Displayed within 5 seconds" value={stats.display.within == null ? '—' : `${stats.display.within}%`} target="Target ≥ 95% of trials" />
                <PerfRow label="Measured trials" value={String(stats.display.n)} target="Target ≥ 30 per measure" />
              </dl>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function PerfRow({ label, value, target }: { label: string; value: string; target: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div>
        <dt className="text-sm font-medium">{label}</dt>
        <dd className="text-xs text-muted">{target}</dd>
      </div>
      <span className="text-lg font-bold">{value}</span>
    </div>
  )
}

function HorizontalBars({ data, colorOf }: { data: { name: string; value: number }[]; colorOf?: (name: string) => string }) {
  if (data.every((d) => d.value === 0)) return <p className="px-5 py-8 text-center text-sm text-muted">No data</p>
  return (
    <div className="px-2 py-3" style={{ height: Math.max(120, data.length * 40 + 24) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }} barCategoryGap={8}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#182238', fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: '#EAF1FC' }} content={<ChartTooltip unit="reports" />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24} fill={C.series}>
            {colorOf && data.map((d) => <Cell key={d.name} fill={colorOf(d.name)} />)}
            <LabelList dataKey="value" position="right" style={{ fill: '#182238', fontSize: 12, fontWeight: 700 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number; payload: { name?: string; label?: string } }[]; label?: string; unit: string }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-control border border-line bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-bold">{p.payload.name ?? p.payload.label ?? label}</p>
      <p className="text-muted">{p.value} {unit}</p>
    </div>
  )
}
