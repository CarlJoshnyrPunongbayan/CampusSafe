import type { AlertSeverity, IncidentStatus, Priority, Role } from '../lib/types'
import { Chip, type Tone } from './ui'

// Colors follow the app's StatusChip: Resolved → success, Critical/Active → danger,
// Under Review/Warning → warning, everything else → blue.

const priorityTone: Record<Priority, Tone> = { High: 'danger', Medium: 'warning', Low: 'blue' }

export function PriorityBadge({ priority }: { priority?: Priority }) {
  if (!priority) return <Chip tone="muted">Tagging…</Chip>
  return <Chip tone={priorityTone[priority]}>{priority}</Chip>
}

// Pending plays the role of the app's "Under Review" chip.
const statusTone: Record<IncidentStatus, Tone> = { Pending: 'warning', Responding: 'blue', Resolved: 'success' }

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <Chip tone={statusTone[status]}>{status}</Chip>
}

export function EscalatedBadge() {
  return <Chip tone="danger">Escalated</Chip>
}

export function SosBadge() {
  return <Chip tone="danger">SOS</Chip>
}

const roleTone: Record<Role, Tone> = { admin: 'navy', responder: 'success', student: 'blue' }
const roleLabel: Record<Role, string> = { admin: 'Admin', responder: 'Responder', student: 'Student' }

export function RoleBadge({ role }: { role: Role }) {
  return <Chip tone={roleTone[role]}>{roleLabel[role]}</Chip>
}

const severityTone: Record<AlertSeverity, Tone> = { Emergency: 'danger', Warning: 'warning', Info: 'blue' }
const severityLabel: Record<AlertSeverity, string> = { Emergency: 'Critical', Warning: 'Warning', Info: 'Information' }

/** Uses the app's alert severity names (Critical / Warning / Information). */
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <Chip tone={severityTone[severity]}>{severityLabel[severity]}</Chip>
}
