import type { Timestamp } from 'firebase/firestore'

type TimeLike = Timestamp | Date | null | undefined

export function toDate(value: TimeLike): Date | null {
  if (!value) return null
  return value instanceof Date ? value : value.toDate()
}

export function timeAgo(value: TimeLike, now = Date.now()): string {
  const date = toDate(value)
  if (!date) return '—'
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000))
  if (seconds < 45) return 'Just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDate(date)
}

export function formatDate(value: TimeLike): string {
  const date = toDate(value)
  return date ? date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

export function formatDateTime(value: TimeLike): string {
  const date = toDate(value)
  return date
    ? date.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'
}

/** 75_000 → "1m 15s" */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—'
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

export function durationBetween(start: TimeLike, end: TimeLike): number | null {
  const a = toDate(start)
  const b = toDate(end)
  return a && b ? b.getTime() - a.getTime() : null
}

export function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null)
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}
