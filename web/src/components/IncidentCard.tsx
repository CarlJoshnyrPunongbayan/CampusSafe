import { Link } from 'react-router'
import { timeAgo } from '../lib/format'
import { incidentLocation, incidentTitle, isEscalatedOpen } from '../lib/incidentLabels'
import { userName, useRefData } from '../lib/refData'
import type { Incident, WithId } from '../lib/types'
import { EscalatedBadge, PriorityBadge, SosBadge, StatusBadge } from './badges'
import { Icon } from './Icon'
import { Avatar } from './ui'

/**
 * The app's IncidentCard (Card + ListTile: soft-blue avatar, bold title, "location • time",
 * StatusChip), extended with the priority and assignment the security office needs.
 */
export function IncidentCard({ incident, now }: { incident: WithId<Incident>; now: number }) {
  const ref = useRefData()
  const escalated = isEscalatedOpen(incident)
  const responder = incident.assignedResponderId ? userName(ref.users, incident.assignedResponderId) : null
  const avatar = incident.isSOS ? { icon: 'sos', tone: 'danger' as const } : escalated ? { icon: 'warning_amber', tone: 'danger' as const } : { icon: 'shield', tone: 'blue' as const }

  return (
    <Link
      to={`/incidents/${incident.id}`}
      className={`mb-2.5 flex items-center gap-4 rounded-card border bg-white px-4 py-3 transition hover:bg-soft-blue/40 ${escalated ? 'border-danger/50' : 'border-line'}`}
    >
      <Avatar icon={avatar.icon} tone={avatar.tone} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-base font-bold">{incidentTitle(incident, ref)}</p>
          {incident.isSOS && <SosBadge />}
          {escalated && <EscalatedBadge />}
          {incident.photoUrls?.length > 0 && <Icon name="photo" size={16} className="text-muted" label="Has photos" />}
        </div>
        <p className="truncate text-sm text-muted">
          {incidentLocation(incident, ref)} • {timeAgo(incident.createdAt, now)}
        </p>
        {incident.description && <p className="mt-0.5 truncate text-sm text-ink/80">{incident.description}</p>}
        <p className="mt-0.5 truncate text-xs text-muted">
          Reported by {userName(ref.users, incident.reporterId)}
          {responder && ` · Responder: ${responder}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusBadge status={incident.status} />
        <PriorityBadge priority={incident.priority} />
      </div>
    </Link>
  )
}
