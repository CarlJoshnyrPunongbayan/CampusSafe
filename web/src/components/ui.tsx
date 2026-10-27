import { Loader2, ShieldCheck, X, type LucideIcon } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

// Shared building blocks styled after the mobile app's widgets
// (Card, PrimaryButton, AppTextField, StatusChip, FeatureCard, CampusAppBar logo).

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-card border border-line bg-white', className)}>{children}</div>
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

type ButtonVariant = 'primary' | 'danger' | 'success' | 'secondary' | 'ghost'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-dark',
  danger: 'bg-danger text-white hover:brightness-95',
  success: 'bg-success text-white hover:brightness-95',
  secondary: 'border border-line bg-white text-ink hover:bg-background',
  ghost: 'text-blue hover:bg-soft-blue',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: LucideIcon
  loading?: boolean
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', icon: Icon, loading, size = 'md', className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-control font-bold transition disabled:cursor-not-allowed disabled:opacity-55',
        size === 'md' ? 'h-11 px-4 text-sm' : 'h-9 px-3 text-[13px]',
        buttonStyles[variant],
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

const controlClass =
  'w-full rounded-control border border-line bg-white px-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-blue focus:ring-2 focus:ring-soft-blue'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(controlClass, 'h-11', props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(controlClass, 'py-3 leading-relaxed', props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(controlClass, 'h-11 pr-8', props.className)} />
}

export type Tone = 'blue' | 'danger' | 'warning' | 'success' | 'muted' | 'navy'

const toneText: Record<Tone, string> = {
  blue: 'text-blue',
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
  muted: 'text-muted',
  navy: 'text-navy',
}
const toneBg: Record<Tone, string> = {
  blue: 'bg-blue/12',
  danger: 'bg-danger/12',
  warning: 'bg-warning/12',
  success: 'bg-success/12',
  muted: 'bg-muted/12',
  navy: 'bg-navy/10',
}

/** Rounded pill, same as the app's StatusChip: tinted background with colored bold text. */
export function Chip({ tone, icon: Icon, children }: { tone: Tone; icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold', toneBg[tone], toneText[tone])}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  )
}

/** Tinted rounded square with an icon, as used by the app's FeatureCard and app bar logo. */
export function IconTile({ icon: Icon, tone = 'blue', size = 'md' }: { icon: LucideIcon; tone?: Tone; size?: 'sm' | 'md' }) {
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center', size === 'md' ? 'h-11 w-11 rounded-control' : 'h-9 w-9 rounded-[10px]', toneBg[tone], toneText[tone])}>
      <Icon className={size === 'md' ? 'h-5 w-5' : 'h-[18px] w-[18px]'} />
    </span>
  )
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <IconTile icon={ShieldCheck} size="sm" />
      {!compact && (
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight">CampusSafe</p>
          <p className="text-[11px] font-medium text-muted">Security Office</p>
        </div>
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, hint, icon, tone = 'blue' }: { label: string; value: ReactNode; hint?: string; icon: LucideIcon; tone?: Tone }) {
  return (
    <Card className="p-[17px]">
      <IconTile icon={icon} tone={tone} />
      <p className="mt-4 text-[28px] font-extrabold leading-none tracking-tight">{value}</p>
      <p className="mt-2 text-[15px] font-bold">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

export function EmptyState({ icon, title, body }: { icon: LucideIcon; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <IconTile icon={icon} />
      <p className="mt-3 font-bold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  )
}

export function Modal({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-card bg-white shadow-xl sm:rounded-card', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-background">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Banner({ tone = 'blue', icon: Icon, title, body, action }: { tone?: Tone; icon: LucideIcon; title: string; body?: ReactNode; action?: ReactNode }) {
  const bg = tone === 'blue' ? 'bg-soft-blue' : toneBg[tone]
  return (
    <div className={cx('flex items-center gap-3 rounded-[14px] px-4 py-3', bg)}>
      <Icon className={cx('h-[22px] w-[22px] shrink-0', toneText[tone])} />
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        {body && <p className="text-xs text-muted">{body}</p>}
      </div>
      {action}
    </div>
  )
}
