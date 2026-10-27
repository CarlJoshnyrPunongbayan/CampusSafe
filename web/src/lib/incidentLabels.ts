import type { RefData } from './refData'
import type { Incident, Priority } from './types'

export const PRIORITY_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }

export function incidentTitle(incident: Incident, ref: Pick<RefData, 'incidentTypes'>): string {
  if (incident.isSOS) return 'SOS: Emergency assistance'
  return ref.incidentTypes.get(incident.typeId)?.name ?? 'Incident'
}

export function incidentLocation(incident: Incident, ref: Pick<RefData, 'locationTags'>): string {
  const tag = incident.locationTagId ? ref.locationTags.get(incident.locationTagId) : null
  if (tag) return tag.name
  if (incident.location) return `GPS ${incident.location.lat.toFixed(5)}, ${incident.location.lng.toFixed(5)}`
  return 'Location not shared'
}

/** Escalated and still waiting: High priority, not acknowledged in time, nobody has picked it up yet. */
export function isEscalatedOpen(incident: Incident): boolean {
  return !!incident.escalated && incident.status === 'Pending' && !incident.acknowledgedAt
}

/** Queue order: escalated first, then unhandled (Pending) before Responding, then priority, then oldest waiting first. */
export function compareQueue(a: Incident, b: Incident): number {
  if (isEscalatedOpen(a) !== isEscalatedOpen(b)) return isEscalatedOpen(a) ? -1 : 1
  if ((a.status === 'Pending') !== (b.status === 'Pending')) return a.status === 'Pending' ? -1 : 1
  const pa = a.priority ? PRIORITY_RANK[a.priority] : 1
  const pb = b.priority ? PRIORITY_RANK[b.priority] : 1
  if (pa !== pb) return pa - pb
  return (a.createdAt?.toMillis() ?? Date.now()) - (b.createdAt?.toMillis() ?? Date.now())
}
