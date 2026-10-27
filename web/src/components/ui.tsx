import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

// Web versions of the CampusSafe mobile app's widgets (CampusSafe_User/lib/widgets) and its
// Material 3 theme (lib/theme/app_theme.dart). Each component notes the widget it mirrors.

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
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
// color.withValues(alpha: .12), as used by StatusChip and FeatureCard.
const toneTint: Record<Tone, string> = {
  blue: 'bg-blue/12',
  danger: 'bg-danger/12',
  warning: 'bg-warning/12',
  success: 'bg-success/12',
  muted: 'bg-muted/12',
  navy: 'bg-navy/10',
}

/** CardTheme: white, radius 16, 1px border, no elevation. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-card border border-line bg-white', className)}>{children}</div>
}

/** _InfoCard title row (bold title + Divider), with an optional TextButton action. */
export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0">
        <h2 className="font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/** SectionHeader: subtitle-style title with an optional TextButton. */
export function SectionHeader({ title, action, to, onAction }: { title: string; action?: string; to?: string; onAction?: () => void }) {
  return (
    <div className="mb-1.5 flex min-h-9 items-center justify-between">
      <h2 className="text-base font-bold">{title}</h2>
      {action && (to ? <TextLink to={to}>{action}</TextLink> : <Button variant="text" size="sm" onClick={onAction}>{action}</Button>)}
    </div>
  )
}

type ButtonVariant = 'primary' | 'danger' | 'success' | 'filled' | 'outlined' | 'text'

const buttonStyles: Record<ButtonVariant, string> = {
  // PrimaryButton: navy (or danger) FilledButton, radius 13, bold label.
  primary: 'rounded-control bg-navy font-bold text-white hover:bg-navy-dark',
  danger: 'rounded-control bg-danger font-bold text-white hover:brightness-95',
  success: 'rounded-control bg-success font-bold text-white hover:brightness-95',
  // Material 3 FilledButton / OutlinedButton / TextButton (stadium shape), as in the app's dialogs.
  filled: 'rounded-full bg-navy font-medium text-white hover:bg-navy-dark',
  outlined: 'rounded-full border border-outline bg-white font-medium text-navy hover:bg-soft-blue',
  text: 'rounded-full font-medium text-navy hover:bg-navy/8',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: string
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', icon, loading, size = 'md', className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'lg' ? 'h-[50px] px-5' : size === 'md' ? 'h-11 px-5' : 'h-9 px-3',
        buttonStyles[variant],
        className,
      )}
    >
      {loading ? <Spinner inline /> : icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

export function IconButton({ icon, label, onClick, to, badge, filled }: { icon: string; label: string; onClick?: () => void; to?: string; badge?: number; filled?: boolean }) {
  const inner = (
    <>
      <Icon name={icon} filled={filled} />
      {badge != null && badge > 0 && (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{badge}</span>
      )}
    </>
  )
  const cls = 'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-ink/8'
  return to ? (
    <Link to={to} className={cls} title={label} aria-label={label}>{inner}</Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} title={label} aria-label={label}>{inner}</button>
  )
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="rounded-full px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/8">
      {children}
    </Link>
  )
}

/** AppTextField: 13px semibold label above a white, radius-13 input. */
export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-[7px] block text-[13px] font-semibold">{label}</span>
      {children}
      {error ? <span className="mt-1 block px-1 text-xs text-danger">{error}</span> : hint && <span className="mt-1 block px-1 text-xs text-muted">{hint}</span>}
    </label>
  )
}

const controlClass =
  'w-full rounded-control border border-line bg-white px-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-blue focus:ring-[0.4px] focus:ring-blue disabled:bg-background'

export function Input({ icon, ...props }: InputHTMLAttributes<HTMLInputElement> & { icon?: string }) {
  if (!icon) return <input {...props} className={cx(controlClass, 'h-[50px]', props.className)} />
  return (
    <div className="relative">
      <Icon name={icon} size={20} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
      <input {...props} className={cx(controlClass, 'h-[50px] pl-11', props.className)} />
    </div>
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(controlClass, 'py-[15px] leading-relaxed', props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(controlClass, 'h-[50px] pr-8', props.className)} />
}

/** StatusChip: tinted pill, 11px bold colored label. */
export function Chip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center rounded-[20px] px-[9px] py-[5px] text-[11px] leading-none font-bold whitespace-nowrap', toneTint[tone], toneText[tone])}>
      {children}
    </span>
  )
}

/** Material 3 ChoiceChip row, as used for the category and alert filters in the app. */
export function ChoiceChips<T extends string>({ options, value, onChange, counts }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; counts?: Partial<Record<T, number>> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = o.value === value
        const count = counts?.[o.value]
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={selected}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border text-sm font-medium transition',
              selected ? 'border-transparent bg-secondary-container pr-4 pl-2 text-ink' : 'border-outline bg-white px-4 text-ink hover:bg-ink/5',
            )}
          >
            {selected && <Icon name="check" size={18} />}
            {o.label}
            {count != null && count > 0 && <span className="text-xs text-muted">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Tinted rounded square with an icon (FeatureCard icon box, AlertCard icon, CampusAppBar logo). */
export function IconTile({ icon, tone = 'blue', size = 'md', soft }: { icon: string; tone?: Tone; size?: 'sm' | 'md'; soft?: boolean }) {
  const bg = soft ? (tone === 'danger' ? 'bg-danger-soft' : 'bg-soft-blue') : toneTint[tone]
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center', size === 'md' ? 'h-11 w-11 rounded-control' : 'h-[34px] w-[34px] rounded-[10px]', bg, toneText[tone])}>
      <Icon name={icon} size={size === 'md' ? 24 : 21} />
    </span>
  )
}

/** CampusAppBar title: soft-blue logo tile + "CampusSafe". */
export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <IconTile icon="shield" size="sm" />
      <div className="leading-tight">
        <p className="text-lg font-extrabold tracking-[-0.2px]">CampusSafe</p>
        {subtitle && <p className="text-[11px] font-medium text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}

/** Page title in the app's style: headlineMedium bold, muted subtitle underneath. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-[18px] flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.5px]">{title}</h1>
        {subtitle && <p className="mt-[5px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/** FeatureCard: tinted icon box, title, two-line subtitle. Links when `to` is given. */
export function FeatureCard({ icon, tone = 'blue', title, subtitle, value, to }: { icon: string; tone?: Tone; title: string; subtitle?: string; value?: ReactNode; to?: string }) {
  const body = (
    <div className="flex h-full flex-col p-[17px]">
      <div className="flex items-start justify-between gap-2">
        <IconTile icon={icon} tone={tone} />
        {value != null && <span className="text-[30px] leading-none font-extrabold tracking-[-0.7px]">{value}</span>}
      </div>
      <div className="flex-1" />
      <p className="mt-5 text-[15px] font-bold">{title}</p>
      {subtitle && <p className="mt-[5px] line-clamp-2 text-xs leading-[1.3] text-muted">{subtitle}</p>}
    </div>
  )
  return to ? (
    <Link to={to} className="block rounded-card border border-line bg-white transition hover:bg-soft-blue/40">{body}</Link>
  ) : (
    <Card>{body}</Card>
  )
}

/** ListTile inside a Card: leading, title, subtitle, trailing, as in IncidentCard. */
export function ListTile({ leading, title, subtitle, trailing, to, onClick, className }: { leading?: ReactNode; title: ReactNode; subtitle?: ReactNode; trailing?: ReactNode; to?: string; onClick?: () => void; className?: string }) {
  const content = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="text-base">{title}</div>
        {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </>
  )
  const cls = cx('flex items-center gap-4 px-4 py-3', (to || onClick) && 'transition hover:bg-soft-blue/40', className)
  if (to) return <Link to={to} className={cls}>{content}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={cx(cls, 'w-full text-left')}>{content}</button>
  return <div className={cls}>{content}</div>
}

/** CircleAvatar with soft-blue background and a blue icon (IncidentCard leading). */
export function Avatar({ icon = 'shield', tone = 'blue', size = 40, solid }: { icon?: string; tone?: Tone; size?: number; solid?: boolean }) {
  const solidBg: Record<Tone, string> = { blue: 'bg-blue', danger: 'bg-danger', warning: 'bg-warning', success: 'bg-success', muted: 'bg-muted', navy: 'bg-navy' }
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full', solid ? cx(solidBg[tone], 'text-white') : cx(tone === 'danger' ? 'bg-danger-soft' : 'bg-soft-blue', toneText[tone]))}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={Math.round(size * 0.6)} />
    </span>
  )
}

/** _InfoCard from the profile screen: title, divider, rows of muted label / value. */
export function InfoCard({ title, rows, action, children }: { title: string; rows?: [string, ReactNode][]; action?: ReactNode; children?: ReactNode }) {
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold">{title}</p>
          {action}
        </div>
        <hr className="my-2 border-line" />
        {rows?.map(([label, value]) => (
          <div key={label} className="flex items-start gap-4 py-1">
            <span className="flex-1 text-muted">{label}</span>
            <span className="max-w-[65%] text-right">{value}</span>
          </div>
        ))}
        {children}
      </div>
    </Card>
  )
}

export function EmptyState({ icon, title, body }: { icon: string; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <Avatar icon={icon} size={48} />
      <p className="mt-3 font-bold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
    </div>
  )
}

/** CircularProgressIndicator. */
export function Spinner({ inline, label = 'Loading…', light }: { inline?: boolean; label?: string; light?: boolean }) {
  const ring = <span className={cx('inline-block animate-spin rounded-full border-[2.5px] border-r-transparent', inline ? 'h-4 w-4' : 'h-7 w-7', light ? 'border-white' : inline ? 'border-current' : 'border-navy')} />
  if (inline) return ring
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted" role="status">
      {ring}
      <span>{label}</span>
    </div>
  )
}

/** Material 3 AlertDialog: radius 28, title, content, right-aligned TextButton + FilledButton. */
export function Modal({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/32 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx('max-h-[90vh] w-full overflow-y-auto rounded-[28px] bg-white shadow-xl', wide ? 'max-w-2xl' : 'max-w-[400px]')}
      >
        <h2 className="px-6 pt-6 pb-4 text-2xl text-ink">{title}</h2>
        <div className="px-6 text-sm text-ink">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 pt-6 pb-6">{footer}</div>}
        {!footer && <div className="pb-6" />}
      </div>
    </div>
  )
}

/** The home screen's soft-blue "Campus safety is connected" banner. */
export function Banner({ tone = 'blue', icon, title, body, action }: { tone?: 'blue' | 'danger'; icon: string; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className={cx('flex items-center gap-[11px] rounded-[14px] px-[15px] py-[13px]', tone === 'danger' ? 'bg-danger-soft' : 'bg-soft-blue')}>
      <Icon name={icon} size={22} className={tone === 'danger' ? 'text-danger' : 'text-blue'} />
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        {body && <p className="mt-0.5 text-xs text-muted">{body}</p>}
      </div>
      {action}
    </div>
  )
}
