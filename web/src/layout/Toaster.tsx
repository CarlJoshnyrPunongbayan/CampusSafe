import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import type { Toast } from '../lib/toast'

const styles = {
  info: { icon: Info, className: 'border-line bg-white', iconClass: 'text-blue' },
  success: { icon: CheckCircle2, className: 'border-line bg-white', iconClass: 'text-success' },
  error: { icon: XCircle, className: 'border-danger/30 bg-white', iconClass: 'text-danger' },
  urgent: { icon: AlertTriangle, className: 'border-danger bg-danger text-white', iconClass: 'text-white' },
}

export function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto" aria-live="assertive">
      {toasts.map((t) => {
        const s = styles[t.tone]
        const Icon = s.icon
        const content = (
          <>
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.iconClass}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{t.title}</p>
              {t.body && <p className={`mt-0.5 text-xs ${t.tone === 'urgent' ? 'text-white/85' : 'text-muted'}`}>{t.body}</p>}
            </div>
          </>
        )
        return (
          <div key={t.id} className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border p-4 shadow-lg ${s.className}`}>
            {t.href ? (
              <Link to={t.href} onClick={() => onDismiss(t.id)} className="flex min-w-0 flex-1 items-start gap-3">
                {content}
              </Link>
            ) : (
              content
            )}
            <button onClick={() => onDismiss(t.id)} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
