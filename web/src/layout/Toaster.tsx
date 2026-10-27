import { Link } from 'react-router'
import { Icon } from '../components/Icon'
import type { Toast } from '../lib/toast'

/**
 * Material SnackBars, as the app uses for feedback. Urgent incident alerts use the danger
 * color so they stand out.
 */
export function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed right-0 bottom-[84px] left-0 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-[88px]" aria-live="assertive">
      {toasts.map((t) => {
        const urgent = t.tone === 'urgent'
        const icon = urgent ? 'warning' : t.tone === 'error' ? 'error_outline' : t.tone === 'success' ? 'check_circle' : 'info'
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-[4px] px-4 py-3 text-white shadow-lg ${urgent ? 'bg-danger' : 'bg-snackbar'}`}
          >
            <Icon name={icon} size={20} className={urgent ? 'text-white' : t.tone === 'error' ? 'text-[#ffb4ab]' : 'text-[#b1c5ff]'} />
            <div className="min-w-0 flex-1 text-sm">
              <p className={urgent ? 'font-bold' : ''}>{t.title}</p>
              {t.body && <p className="text-white/80">{t.body}</p>}
            </div>
            {t.href && (
              <Link to={t.href} onClick={() => onDismiss(t.id)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${urgent ? 'text-white hover:bg-white/15' : 'text-[#b1c5ff] hover:bg-white/10'}`}>
                Open
              </Link>
            )}
            <button onClick={() => onDismiss(t.id)} aria-label="Dismiss" className="rounded-full p-1 text-white/80 hover:bg-white/10">
              <Icon name="close" size={18} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
