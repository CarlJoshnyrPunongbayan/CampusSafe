import type { ReactNode } from 'react'
import type { AlertSeverity } from '../lib/types'
import { SeverityBadge } from './badges'
import { Icon } from './Icon'
import { Card } from './ui'

/** The app's AlertCard: tinted icon box, bold title, "meta • time", chips. */
export function AlertCard({ title, body, meta, severity, extra }: { title: string; body?: string; meta: string; severity: AlertSeverity; extra?: ReactNode }) {
  const critical = severity === 'Emergency'
  return (
    <Card className="mb-3">
      <div className="flex items-start gap-3 p-4">
        <span className={`rounded-xl p-2.5 ${critical ? 'bg-danger-soft text-danger' : 'bg-soft-blue text-blue'}`}>
          <Icon name="notifications_active" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{title}</p>
          {body && <p className="mt-1 text-sm whitespace-pre-wrap text-ink/80">{body}</p>}
          <p className="mt-[7px] text-xs text-muted">{meta}</p>
          <div className="mt-2.5 flex flex-wrap gap-[7px]">
            <SeverityBadge severity={severity} />
            {extra}
          </div>
        </div>
      </div>
    </Card>
  )
}
