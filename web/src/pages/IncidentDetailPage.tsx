import { collection, doc, orderBy, query, serverTimestamp, updateDoc, type UpdateData } from 'firebase/firestore'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleCheck,
  Clock,
  Copy,
  History,
  ImageOff,
  MapPin,
  Phone,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { EscalatedBadge, PriorityBadge, RoleBadge, SosBadge, StatusBadge } from '../components/badges'
import { IncidentChat } from '../components/IncidentChat'
import { IncidentMap } from '../components/IncidentMap'
import { googleMapsUrl } from '../lib/maps'
import { Banner, Button, Card, CardHeader, EmptyState, Field, Select, Spinner } from '../components/ui'
import { db } from '../lib/firebase'
import { durationBetween, formatDateTime, formatDuration, timeAgo } from '../lib/format'
import { useCollection, useDocument, useNow } from '../lib/hooks'
import { incidentLocation, incidentTitle, isEscalatedOpen } from '../lib/incidentLabels'
import { userName, useRefData } from '../lib/refData'
import { useToast } from '../lib/toast'
import type { ActivityLog, Incident, Priority } from '../lib/types'

export function IncidentDetailPage() {
  const { id = '' } = useParams()
  const incidentRef = useMemo(() => doc(db, 'incidents', id), [id])
  const { data: incident, loading } = useDocument<Incident>(incidentRef)
  const ref = useRefData()
  const now = useNow(15_000)

  if (loading) return <Spinner />
  if (!incident) {
    return (
      <Card>
        <EmptyState icon={AlertTriangle} title="Incident not found" body="It may have been removed, or the link is wrong." />
        <div className="pb-8 text-center">
          <Link to="/incidents" className="font-bold text-blue">Back to the queue</Link>
        </div>
      </Card>
    )
  }

  const tag = incident.locationTagId ? ref.locationTags.get(incident.locationTagId) : null
  const point = incident.location ?? (tag ? { lat: tag.lat, lng: tag.lng } : null)
  const type = ref.incidentTypes.get(incident.typeId)

  return (
    <div>
      <Link to="/incidents" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue hover:underline">
        <ArrowLeft className="h-4 w-4" /> Incident Queue
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={incident.priority} />
            <StatusBadge status={incident.status} />
            {incident.isSOS && <SosBadge />}
            {isEscalatedOpen(incident) && <EscalatedBadge />}
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{incidentTitle(incident, ref)}</h1>
          <p className="mt-1 text-sm text-muted">
            Reported {timeAgo(incident.createdAt, now)} · {formatDateTime(incident.createdAt)} · ID {incident.id.slice(0, 8)}
          </p>
        </div>
      </div>

      {isEscalatedOpen(incident) && (
        <div className="mb-5">
          <Banner
            tone="danger"
            icon={AlertTriangle}
            title="Escalated: this High-priority report has not been acknowledged"
            body={`Escalated ${timeAgo(incident.escalatedAt, now)}. Acknowledge it and assign a responder now.`}
          />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Report details" />
            <div className="space-y-4 px-5 py-4">
              <p className="whitespace-pre-wrap">{incident.description || <span className="text-muted">No description provided.</span>}</p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Detail label="Incident type" value={incident.isSOS ? 'SOS request' : type?.name ?? incident.typeId} />
                <Detail label="Reported from phone at" value={formatDateTime(incident.clientCreatedAt)} />
                <Detail label="Priority tagging" value={incident.priorityReason ?? 'Pending'} />
                <Detail label="Priority confirmed by officer" value={incident.priorityConfirmed ? 'Yes' : 'Not yet'} />
                {incident.escalated && <Detail label="Escalation" value={`Escalated ${formatDateTime(incident.escalatedAt)} (not acknowledged in time)`} />}
              </dl>
            </div>
          </Card>

          <Card>
            <CardHeader title="Photos" subtitle={`${incident.photoUrls?.length ?? 0} of 3 attached`} />
            <div className="p-5">
              {incident.photoUrls?.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {incident.photoUrls.map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-control border border-line">
                      <img src={url} alt={`Incident photo ${i + 1}`} className="aspect-square w-full object-cover transition group-hover:scale-105" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <ImageOff className="h-4 w-4" /> No photos attached
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Location"
              subtitle={incidentLocation(incident, ref)}
              action={point && (
                <a href={googleMapsUrl(point)} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue hover:underline">
                  Directions
                </a>
              )}
            />
            <div className="space-y-3 p-5">
              {point ? <IncidentMap point={point} label={tag?.name ?? 'Reported location'} /> : <p className="text-sm text-muted">The reporter did not share a location.</p>}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {tag && (
                  <span className="flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-blue" /> QR tag: <b>{tag.name}</b> ({tag.building}, floor {tag.floor})
                  </span>
                )}
                {incident.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue" /> GPS accuracy:{' '}
                    <b className={incident.location.accuracy != null && incident.location.accuracy > 20 ? 'text-warning' : ''}>
                      {incident.location.accuracy != null ? `±${Math.round(incident.location.accuracy)} m` : 'unknown'}
                    </b>
                  </span>
                )}
              </div>
            </div>
          </Card>

          <IncidentChat incidentId={incident.id} />
        </div>

        <div className="space-y-5">
          <ActionsCard incident={{ ...incident }} />
          <ReporterCard uid={incident.reporterId} />
          <TimelineCard incident={incident} />
          <ActivityCard incidentId={incident.id} />
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control bg-background px-3 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}

/** Workflow steps 4–7: acknowledge, confirm priority, assign responder, Pending → Responding → Resolved. */
function ActionsCard({ incident }: { incident: Incident & { id: string } }) {
  const { user } = useAuth()
  const ref = useRefData()
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [priority, setPriority] = useState<Priority | ''>(incident.priority ?? '')
  const [lastPriority, setLastPriority] = useState(incident.priority)
  if (lastPriority !== incident.priority) {
    setLastPriority(incident.priority)
    setPriority(incident.priority ?? '')
  }

  const responders = [...ref.users.values()].filter((u) => u.role === 'responder').sort((a, b) => a.name.localeCompare(b.name))

  async function update(key: string, data: UpdateData<Incident>, success: string) {
    if (!user) return
    setBusy(key)
    try {
      await updateDoc(doc(db, 'incidents', incident.id), { ...data, updatedBy: user.uid })
      toast({ tone: 'success', title: success })
    } catch {
      toast({ tone: 'error', title: 'Update failed', body: 'You may be offline or lack permission.' })
    } finally {
      setBusy(null)
    }
  }

  const ack = incident.acknowledgedAt ? {} : { acknowledgedAt: serverTimestamp() }

  return (
    <Card>
      <CardHeader title="Response" subtitle="Each action is recorded in the activity log" />
      <div className="space-y-5 p-5">
        {!incident.acknowledgedAt ? (
          <Button className="w-full" icon={ShieldCheck} loading={busy === 'ack'} onClick={() => update('ack', { acknowledgedAt: serverTimestamp() }, 'Report acknowledged')}>
            Acknowledge report
          </Button>
        ) : (
          <p className="flex items-center gap-2 rounded-control bg-success/10 px-3 py-2.5 text-sm font-medium text-success">
            <CircleCheck className="h-4 w-4" /> Acknowledged {formatDateTime(incident.acknowledgedAt)}
          </p>
        )}

        <Field label="Priority" hint={incident.priorityReason ? `System: ${incident.priorityReason}` : undefined}>
          <div className="flex gap-2">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} aria-label="Priority">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
            <Button
              variant="secondary"
              loading={busy === 'priority'}
              disabled={!priority || (priority === incident.priority && incident.priorityConfirmed)}
              onClick={() => update('priority', { priority: priority as Priority, priorityConfirmed: true }, priority === incident.priority ? 'Priority confirmed' : `Priority changed to ${priority}`)}
            >
              {priority === incident.priority ? 'Confirm' : 'Change'}
            </Button>
          </div>
        </Field>

        <Field label="Assigned responder" hint={responders.length === 0 ? 'No responder accounts yet. Promote users on the Users page.' : undefined}>
          <Select
            value={incident.assignedResponderId ?? ''}
            disabled={busy === 'assign' || incident.status === 'Resolved'}
            onChange={(e) => update('assign', { assignedResponderId: e.target.value || null, ...ack }, e.target.value ? 'Responder assigned' : 'Responder unassigned')}
            aria-label="Assigned responder"
          >
            <option value="">Not assigned</option>
            {responders.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-bold">Status</p>
          <div className="grid gap-2">
            {incident.status === 'Pending' && (
              <Button variant="primary" icon={Truck} loading={busy === 'responding'} onClick={() => update('responding', { status: 'Responding', respondingAt: serverTimestamp(), ...ack }, 'Marked as Responding')}>
                Mark as Responding
              </Button>
            )}
            {incident.status !== 'Resolved' && (
              <Button variant="success" icon={CheckCircle2} loading={busy === 'resolved'} onClick={() => update('resolved', { status: 'Resolved', resolvedAt: serverTimestamp(), ...ack }, 'Incident resolved')}>
                Mark as Resolved
              </Button>
            )}
            {incident.status === 'Resolved' && (
              <Button variant="secondary" icon={RotateCcw} loading={busy === 'reopen'} onClick={() => update('reopen', { status: 'Pending' }, 'Incident reopened')}>
                Reopen incident
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function ReporterCard({ uid }: { uid: string }) {
  const ref = useRefData()
  const toast = useToast()
  const reporter = ref.users.get(uid)
  return (
    <Card>
      <CardHeader title="Reporter" />
      <div className="space-y-3 p-5">
        {reporter ? (
          <>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-soft-blue text-blue">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold">{reporter.name}</p>
                <p className="truncate text-xs text-muted">{reporter.studentId ? `ID ${reporter.studentId} · ` : ''}{reporter.email}</p>
              </div>
              <span className="ml-auto"><RoleBadge role={reporter.role} /></span>
            </div>
            {reporter.mobileNo ? (
              <div className="flex gap-2">
                <a href={`tel:${reporter.mobileNo}`} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-control bg-success text-sm font-bold text-white hover:brightness-95">
                  <Phone className="h-4 w-4" /> Call {reporter.mobileNo}
                </a>
                <Button
                  variant="secondary"
                  icon={Copy}
                  aria-label="Copy number"
                  onClick={() => navigator.clipboard?.writeText(reporter.mobileNo).then(() => toast({ tone: 'success', title: 'Number copied' }))}
                />
              </div>
            ) : (
              <p className="text-sm text-muted">No mobile number on file.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Reporter profile not found.</p>
        )}
      </div>
    </Card>
  )
}

function TimelineCard({ incident }: { incident: Incident }) {
  const { config } = useRefData()
  const target = (config.escalationMinutes ?? 2) * 60_000
  const ackMs = durationBetween(incident.createdAt, incident.acknowledgedAt)
  const steps = [
    { label: 'Reported', at: incident.createdAt, icon: Clock },
    { label: 'Acknowledged', at: incident.acknowledgedAt, icon: ShieldCheck, since: ackMs },
    { label: 'Responding', at: incident.respondingAt, icon: Truck, since: durationBetween(incident.createdAt, incident.respondingAt) },
    { label: 'Resolved', at: incident.resolvedAt, icon: CheckCircle2, since: durationBetween(incident.createdAt, incident.resolvedAt) },
  ]
  return (
    <Card>
      <CardHeader title="Response times" subtitle="Measured from when the report reached the server" />
      <ol className="space-y-4 p-5">
        {steps.map(({ label, at, icon: Icon, since }) => (
          <li key={label} className="flex items-start gap-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${at ? 'bg-navy text-white' : 'bg-background text-muted'}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${at ? '' : 'text-muted'}`}>{label}</p>
              <p className="text-xs text-muted">{at ? formatDateTime(at) : 'Not yet'}</p>
            </div>
            {since != null && (
              <span className={`text-xs font-bold ${label === 'Acknowledged' && incident.priority === 'High' && since > target ? 'text-danger' : 'text-ink'}`}>
                +{formatDuration(since)}
              </span>
            )}
          </li>
        ))}
      </ol>
    </Card>
  )
}

const ACTION_LABELS: Record<string, string> = {
  reported: 'submitted the report',
  sos_requested: 'sent an SOS request',
  acknowledged: 'acknowledged the report',
  priority_changed: 'changed the priority',
  priority_confirmed: 'confirmed the priority',
  responder_assigned: 'changed the assigned responder',
  status_changed: 'changed the status',
  escalated: 'escalated the report',
}

function ActivityCard({ incidentId }: { incidentId: string }) {
  const ref = useRefData()
  const q = useMemo(() => query(collection(db, 'incidents', incidentId, 'activityLogs'), orderBy('at', 'desc')), [incidentId])
  const { data: logs, loading } = useCollection<ActivityLog>(q)

  const describe = (log: ActivityLog) => {
    if (log.action === 'responder_assigned') return log.to ? `assigned ${userName(ref.users, log.to)}` : 'removed the assigned responder'
    if (log.from || log.to) {
      const from = log.from ? `${log.from} → ` : ''
      return `${ACTION_LABELS[log.action] ?? log.action} (${from}${log.to ?? ''})`
    }
    return ACTION_LABELS[log.action] ?? log.action
  }

  return (
    <Card>
      <CardHeader title="Activity log" />
      <div className="p-5">
        {loading ? (
          <Spinner />
        ) : logs.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted"><History className="h-4 w-4" /> No activity recorded yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-line pl-4">
            {logs.map((log) => (
              <li key={log.id} className="relative">
                <span className={`absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full ${log.action === 'escalated' ? 'bg-danger' : 'bg-blue'}`} />
                <p className="text-sm">
                  <b>{userName(ref.users, log.actorId)}</b> {describe(log)}
                </p>
                {log.note && <p className="text-xs text-muted">{log.note}</p>}
                <p className="text-xs text-muted">{formatDateTime(log.at)}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  )
}
