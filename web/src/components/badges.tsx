import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Clock, Minus, Siren, Truck } from 'lucide-react'
import type { AlertSeverity, IncidentStatus, Priority, Role } from '../lib/types'
import { Chip, type Tone } from './ui'

const priorityTone: Record<Priority, Tone> = { High: 'danger', Medium: 'warning', Low: 'blue' }
const priorityIcon = { High: ArrowUp, Medium: Minus, Low: ArrowDown }

export function PriorityBadge({ priority }: { priority?: Priority }) {
  if (!priority) return <Chip tone="muted">Tagging…</Chip>
  return <Chip tone={priorityTone[priority]} icon={priorityIcon[priority]}>{priority}</Chip>
}

const statusTone: Record<IncidentStatus, Tone> = { Pending: 'blue', Responding: 'warning', Resolved: 'success' }
const statusIcon = { Pending: Clock, Responding: Truck, Resolved: CheckCircle2 }

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <Chip tone={statusTone[status]} icon={statusIcon[status]}>{status}</Chip>
}

export function EscalatedBadge() {
  return <Chip tone="danger" icon={AlertTriangle}>Escalated</Chip>
}

export function SosBadge() {
  return <Chip tone="danger" icon={Siren}>SOS</Chip>
}

const roleTone: Record<Role, Tone> = { admin: 'navy', responder: 'warning', student: 'blue' }
const roleLabel: Record<Role, string> = { admin: 'Admin', responder: 'Responder', student: 'Student' }

export function RoleBadge({ role }: { role: Role }) {
  return <Chip tone={roleTone[role]}>{roleLabel[role]}</Chip>
}

const severityTone: Record<AlertSeverity, Tone> = { Emergency: 'danger', Warning: 'warning', Info: 'blue' }

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <Chip tone={severityTone[severity]}>{severity}</Chip>
}
