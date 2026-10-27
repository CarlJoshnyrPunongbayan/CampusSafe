import { addDoc, collection, limit, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { Bell, Megaphone, Send } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { SeverityBadge } from '../components/badges'
import { Button, Card, CardHeader, EmptyState, Field, IconTile, Input, Modal, PageHeader, Spinner, Textarea } from '../components/ui'
import { db } from '../lib/firebase'
import { formatDateTime } from '../lib/format'
import { useCollection } from '../lib/hooks'
import { userName, useRefData } from '../lib/refData'
import { useToast } from '../lib/toast'
import type { Alert, AlertSeverity } from '../lib/types'

const SEVERITIES: { value: AlertSeverity; label: string; hint: string }[] = [
  { value: 'Info', label: 'Information', hint: 'Drills, advisories, schedule changes' },
  { value: 'Warning', label: 'Warning', hint: 'Suspicious activity, hazards, weather' },
  { value: 'Emergency', label: 'Emergency', hint: 'Immediate danger, take action now' },
]

const TEMPLATES = [
  { title: 'Fire drill', body: 'A scheduled fire drill will begin at 2:00 PM. Please proceed calmly to the nearest assembly area when the alarm sounds.', severity: 'Info' as const },
  { title: 'Suspicious person reported', body: 'A suspicious person was reported near the main gate. Avoid the area and report any sightings through CampusSafe.', severity: 'Warning' as const },
  { title: 'Evacuate immediately', body: 'An emergency has been reported on campus. Evacuate the building now and follow instructions from security personnel.', severity: 'Emergency' as const },
]

export function AlertsPage() {
  const { user } = useAuth()
  const ref = useRefData()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [severity, setSeverity] = useState<AlertSeverity>('Info')
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)

  const q = useMemo(() => query(collection(db, 'alerts'), orderBy('sentAt', 'desc'), limit(50)), [])
  const { data: alerts, loading } = useCollection<Alert>(q)

  const recipients = [...ref.users.values()].filter((u) => u.role !== 'admin').length

  function review(e: FormEvent) {
    e.preventDefault()
    if (title.trim() && body.trim()) setConfirming(true)
  }

  async function send() {
    if (!user) return
    setSending(true)
    try {
      await addDoc(collection(db, 'alerts'), { title: title.trim(), body: body.trim(), severity, sentBy: user.uid, sentAt: serverTimestamp() })
      toast({ tone: 'success', title: 'Alert broadcast', body: 'Push notifications are being sent to all app users.' })
      setTitle('')
      setBody('')
      setSeverity('Info')
      setConfirming(false)
    } catch {
      toast({ tone: 'error', title: 'Alert not sent', body: 'Check your connection and try again.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader title="Broadcast Alerts" subtitle="Send a push notification to every CampusSafe mobile user." />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="New alert" />
          <form onSubmit={review} className="space-y-4 p-5">
            <div>
              <p className="mb-1.5 text-sm font-bold">Severity</p>
              <div className="grid gap-2">
                {SEVERITIES.map((s) => (
                  <label
                    key={s.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-control border px-4 py-3 transition ${
                      severity === s.value ? 'border-blue bg-soft-blue' : 'border-line hover:bg-background'
                    }`}
                  >
                    <input type="radio" name="severity" value={s.value} checked={severity === s.value} onChange={() => setSeverity(s.value)} className="accent-navy" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{s.label}</p>
                      <p className="text-xs text-muted">{s.hint}</p>
                    </div>
                    <SeverityBadge severity={s.value} />
                  </label>
                ))}
              </div>
            </div>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. Fire drill at 2 PM" required />
            </Field>
            <Field label="Message" hint={`${body.length}/1000`}>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={5} placeholder="What should students know or do?" required />
            </Field>
            <div className="flex flex-wrap gap-2">
              <span className="w-full text-xs font-bold text-muted">Templates</span>
              {TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  type="button"
                  onClick={() => { setTitle(t.title); setBody(t.body); setSeverity(t.severity) }}
                  className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-soft-blue"
                >
                  {t.title}
                </button>
              ))}
            </div>
            <Button type="submit" variant={severity === 'Emergency' ? 'danger' : 'primary'} icon={Send} className="w-full" disabled={!title.trim() || !body.trim()}>
              Review and send
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Sent alerts" subtitle="Most recent 50" />
          {loading ? (
            <Spinner />
          ) : alerts.length === 0 ? (
            <EmptyState icon={Megaphone} title="No alerts sent yet" body="Alerts you broadcast will be listed here." />
          ) : (
            <ul className="divide-y divide-line">
              {alerts.map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-4">
                  <IconTile icon={Bell} size="sm" tone={a.severity === 'Emergency' ? 'danger' : a.severity === 'Warning' ? 'warning' : 'blue'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">{a.title}</p>
                      <SeverityBadge severity={a.severity} />
                    </div>
                    <p className="mt-0.5 text-sm whitespace-pre-wrap text-muted">{a.body}</p>
                    <p className="mt-1.5 text-xs text-muted">{formatDateTime(a.sentAt)} · by {userName(ref.users, a.sentBy)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={confirming}
        title="Send this alert?"
        onClose={() => setConfirming(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant={severity === 'Emergency' ? 'danger' : 'primary'} icon={Send} loading={sending} onClick={send}>Broadcast now</Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-muted">
          This notification goes to all {recipients} student and responder accounts and cannot be recalled.
        </p>
        <div className="rounded-card border border-line bg-background p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold">{title}</p>
            <SeverityBadge severity={severity} />
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap">{body}</p>
        </div>
      </Modal>
    </div>
  )
}
