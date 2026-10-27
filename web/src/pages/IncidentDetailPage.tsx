import { collection, doc, orderBy, query, serverTimestamp, updateDoc, type UpdateData } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { EscalatedBadge, PriorityBadge, RoleBadge, SosBadge, StatusBadge } from '../components/badges'
import { Icon } from '../components/Icon'
import { IncidentChat } from '../components/IncidentChat'
import { IncidentMap } from '../components/IncidentMap'
import { Avatar, Banner, Button, Card, CardHeader, EmptyState, Field, InfoCard, ListTile, Select, Spinner } from '../components/ui'
import { db } from '../lib/firebase'
import { durationBetween, formatDateTime, formatDuration, timeAgo } from '../lib/format'
import { useCollection, useDocument, useNow } from '../lib/hooks'
import { incidentLocation, incidentTitle, isEscalatedOpen } from '../lib/incidentLabels'
import { googleMapsUrl } from '../lib/maps'
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
        <EmptyState icon="search_off" title="Incident not found" body="It may have been removed, or the link is wrong." />
        <div className="pb-8 text-center">
          <Link to="/incidents" className="font-medium text-navy">Back to incident reports</Link>
        </div>
      </Card>
    )
  }

  const tag = incident.locationTagId ? ref.locationTags.get(incident.locationTagId) : null
  const point = incident.location ?? (tag ? { lat: tag.lat, lng: tag.lng } : null)
  const type = ref.incidentTypes.get(incident.typeId)

  return (
    <div>
      <Link to="/incidents" className="-ml-2 mb-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-navy hover:bg-navy/8">
        <Icon name="arrow_back" size={20} /> Incident reports
      </Link>

      <div className="mb-[18px]">
        <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.5px]">{incidentTitle(incident, ref)}</h1>
        <p className="mt-[5px] text-muted">
          {incidentLocation(incident, ref)} • {timeAgo(incident.createdAt, now)}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-[7px]">
          <StatusBadge status={incident.status} />
          <PriorityBadge priority={incident.priority} />
          {incident.isSOS && <SosBadge />}
          {isEscalatedOpen(incident) && <EscalatedBadge />}
        </div>
      </div>

      {isEscalatedOpen(incident) && (
        <div className="mb-[18px]">
          <Banner
            tone="danger"
            icon="warning_amber"
            title="Escalated: High-priority report not acknowledged"
            body={`Escalated ${timeAgo(incident.escalatedAt, now)}. Acknowledge it and assign a responder now.`}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <InfoCard
            title="Report details"
            rows={[
              ['Category', incident.isSOS ? 'SOS request' : type?.name ?? incident.typeId],
              ['Reported', formatDateTime(incident.createdAt)],
              ['Sent from phone at', formatDateTime(incident.clientCreatedAt)],
              ['Priority tagging', incident.priorityReason ?? 'Pending'],
              ['Priority confirmed', incident.priorityConfirmed ? 'Yes' : 'Not yet'],
              ...(incident.escalated ? [['Escalation', `Escalated ${formatDateTime(incident.escalatedAt)}`] as [string, string]] : []),
              ['Reference ID', incident.id.slice(0, 8)],
            ]}
          >
            <p className="mt-3 rounded-control bg-background px-4 py-3 whitespace-pre-wrap">
              {incident.description || <span className="text-muted">No description provided.</span>}
            </p>
          </InfoCard>

          <Card>
            <CardHeader title="Photos" subtitle={`${incident.photoUrls?.length ?? 0} of 3 attached`} />
            <div className="p-4">
              {incident.photoUrls?.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {incident.photoUrls.map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-control border border-line">
                      <img src={url} alt={`Incident photo ${i + 1}`} className="aspect-square w-full object-cover transition hover:scale-105" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-2 text-muted"><Icon name="hide_image" size={20} /> No photos attached</p>
              )}
            </div>
          </Card>

          <Card>
            <ListTile
              leading={<Icon name="location_on" className="text-muted" />}
              title={<span className="font-medium">{tag ? tag.name : 'Reported location'}</span>}
              subtitle={
                <>
                  {tag ? `QR tag · ${tag.building}, floor ${tag.floor}` : 'From phone GPS'}
                  {incident.location?.accuracy != null && (
                    <span className={incident.location.accuracy > 20 ? 'text-warning' : ''}> · accuracy ±{Math.round(incident.location.accuracy)} m</span>
                  )}
                </>
              }
              trailing={point && (
                <a href={googleMapsUrl(point)} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/8">
                  Directions
                </a>
              )}
            />
            <div className="px-4 pb-4">
              {point ? <IncidentMap point={point} label={tag?.name ?? 'Reported location'} /> : <p className="text-muted">The reporter did not share a location.</p>}
            </div>
          </Card>

          <IncidentChat incidentId={incident.id} />
        </div>

        <div className="space-y-4">
          <ActionsCard incident={incident} />
          <ReporterCard uid={incident.reporterId} />
          <StatusUpdatesCard incident={incident} />
          <ActivityCard incidentId={incident.id} />
        </div>
      </div>
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
      <CardHeader title="Response" subtitle="Each action is saved to the activity log" />
      <div className="space-y-4 p-4">
        {!incident.acknowledgedAt ? (
          <Button size="lg" className="w-full" icon="verified_user" loading={busy === 'ack'} onClick={() => update('ack', { acknowledgedAt: serverTimestamp() }, 'Report acknowledged')}>
            Acknowledge report
          </Button>
        ) : (
          <div className="flex items-center gap-3 rounded-[14px] bg-success/12 px-4 py-3 text-sm">
            <Icon name="check_circle" size={20} className="text-success" />
            <span>Acknowledged {formatDateTime(incident.acknowledgedAt)}</span>
          </div>
        )}

        <Field label="Priority" hint={incident.priorityReason ? `System: ${incident.priorityReason}` : undefined}>
          <div className="flex gap-2">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} aria-label="Priority">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
            <Button
              variant="outlined"
              className="!h-[50px]"
              loading={busy === 'priority'}
              disabled={!priority || (priority === incident.priority && incident.priorityConfirmed)}
              onClick={() => update('priority', { priority: priority as Priority, priorityConfirmed: true }, priority === incident.priority ? 'Priority confirmed' : `Priority changed to ${priority}`)}
            >
              {priority === incident.priority ? 'Confirm' : 'Change'}
            </Button>
          </div>
        </Field>

        <Field label="Assigned responder" hint={responders.length === 0 ? 'No responder accounts yet. Set roles on the Users page.' : undefined}>
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

        <div className="space-y-2.5">
          <p className="text-[13px] font-semibold">Status</p>
          {incident.status === 'Pending' && (
            <Button size="lg" className="w-full" icon="directions_run" loading={busy === 'responding'} onClick={() => update('responding', { status: 'Responding', respondingAt: serverTimestamp(), ...ack }, 'Marked as Responding')}>
              Mark as responding
            </Button>
          )}
          {incident.status !== 'Resolved' && (
            <Button size="lg" variant="success" className="w-full" icon="task_alt" loading={busy === 'resolved'} onClick={() => update('resolved', { status: 'Resolved', resolvedAt: serverTimestamp(), ...ack }, 'Incident resolved')}>
              Mark as resolved
            </Button>
          )}
          {incident.status === 'Resolved' && (
            <Button size="lg" variant="outlined" className="w-full !rounded-control" icon="restart_alt" loading={busy === 'reopen'} onClick={() => update('reopen', { status: 'Pending' }, 'Incident reopened')}>
              Reopen incident
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

/** Reporter details plus the SOS status screen's "Communication options" (Call / Chat). */
function ReporterCard({ uid }: { uid: string }) {
  const ref = useRefData()
  const toast = useToast()
  const reporter = ref.users.get(uid)
  if (!reporter) return <InfoCard title="Reporter" rows={[['Profile', 'Not found']]} />
  return (
    <InfoCard
      title="Reporter"
      action={<RoleBadge role={reporter.role} />}
      rows={[
        ['Name', reporter.name],
        ...(reporter.studentId ? [['Student ID', reporter.studentId] as [string, string]] : []),
        ['Email', <span key="email" className="break-all">{reporter.email}</span>],
        ['Phone', reporter.mobileNo || '—'],
      ]}
    >
      {reporter.mobileNo && (
        <div className="mt-3 flex gap-3">
          <a href={`tel:${reporter.mobileNo}`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-navy text-sm font-medium text-white hover:bg-navy-dark">
            <Icon name="call" size={18} /> Call
          </a>
          <Button
            variant="outlined"
            className="!h-10 flex-1"
            icon="content_copy"
            onClick={() => navigator.clipboard?.writeText(reporter.mobileNo).then(() => toast({ tone: 'success', title: 'Number copied' }))}
          >
            Copy number
          </Button>
        </div>
      )}
    </InfoCard>
  )
}

/** Like the SOS status screen's "Status updates" list, with response times. */
function StatusUpdatesCard({ incident }: { incident: Incident }) {
  const { config } = useRefData()
  const target = (config.escalationMinutes ?? 2) * 60_000
  const steps = [
    { label: 'Report received', at: incident.createdAt, since: null },
    { label: 'Security acknowledged', at: incident.acknowledgedAt, since: durationBetween(incident.createdAt, incident.acknowledgedAt), late: true },
    { label: 'Responder en route', at: incident.respondingAt, since: durationBetween(incident.createdAt, incident.respondingAt) },
    { label: 'Resolved', at: incident.resolvedAt, since: durationBetween(incident.createdAt, incident.resolvedAt) },
  ]
  return (
    <Card>
      <CardHeader title="Status updates" subtitle="Time since the report reached the server" />
      <div className="py-1">
        {steps.map((s) => (
          <ListTile
            key={s.label}
            leading={s.at ? <Avatar icon="check" tone="success" /> : <Avatar icon="schedule" tone="muted" />}
            title={<span className={s.at ? '' : 'text-muted'}>{s.label}</span>}
            subtitle={s.at ? formatDateTime(s.at) : 'Not yet'}
            trailing={
              s.since != null && (
                <span className={`text-sm font-bold ${s.late && incident.priority === 'High' && s.since > target ? 'text-danger' : ''}`}>+{formatDuration(s.since)}</span>
              )
            }
          />
        ))}
      </div>
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
    if (log.from || log.to) return `${ACTION_LABELS[log.action] ?? log.action} (${log.from ? `${log.from} → ` : ''}${log.to ?? ''})`
    return ACTION_LABELS[log.action] ?? log.action
  }

  return (
    <Card>
      <CardHeader title="Activity log" />
      <div className="p-4">
        {loading ? (
          <Spinner />
        ) : logs.length === 0 ? (
          <p className="flex items-center gap-2 text-muted"><Icon name="history" size={20} /> No activity recorded yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-line pl-4">
            {logs.map((log) => (
              <li key={log.id} className="relative">
                <span className={`absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full ${log.action === 'escalated' ? 'bg-danger' : 'bg-blue'}`} />
                <p className="text-sm"><b>{userName(ref.users, log.actorId)}</b> {describe(log)}</p>
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
