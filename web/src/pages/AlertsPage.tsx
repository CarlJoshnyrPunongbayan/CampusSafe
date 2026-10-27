import { addDoc, collection, limit, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { AlertCard } from '../components/AlertCard'
import { SeverityBadge } from '../components/badges'
import { Button, Card, CardHeader, ChoiceChips, EmptyState, Field, Input, Modal, PageHeader, Spinner, Textarea } from '../components/ui'
import { db } from '../lib/firebase'
import { formatDateTime, timeAgo } from '../lib/format'
import { useCollection, useNow } from '../lib/hooks'
import { severityName } from '../lib/incidentLabels'
import { userName, useRefData } from '../lib/refData'
import { useToast } from '../lib/toast'
import type { Alert, AlertSeverity } from '../lib/types'

const SEVERITIES: AlertSeverity[] = ['Emergency', 'Warning', 'Info']

const TEMPLATES = [
  { title: 'Fire drill', body: 'A scheduled fire drill will begin at 2:00 PM. Please proceed calmly to the nearest assembly area when the alarm sounds.', severity: 'Info' as const },
  { title: 'Suspicious person reported', body: 'A suspicious person was reported near the main gate. Avoid the area and report any sightings through CampusSafe.', severity: 'Warning' as const },
  { title: 'Evacuate immediately', body: 'An emergency has been reported on campus. Evacuate the building now and follow instructions from security personnel.', severity: 'Emergency' as const },
]

const FILTERS = [
  { value: 'All', label: 'All' },
  { value: 'Emergency', label: 'Critical' },
  { value: 'Warning', label: 'Warning' },
  { value: 'Info', label: 'Information' },
] as const

export function AlertsPage() {
  const { user } = useAuth()
  const ref = useRefData()
  const toast = useToast()
  const now = useNow()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [severity, setSeverity] = useState<AlertSeverity>('Info')
  const [filter, setFilter] = useState<'All' | AlertSeverity>('All')
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)

  const q = useMemo(() => query(collection(db, 'alerts'), orderBy('sentAt', 'desc'), limit(50)), [])
  const { data: alerts, loading } = useCollection<Alert>(q)
  const shown = filter === 'All' ? alerts : alerts.filter((a) => a.severity === filter)
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
      <PageHeader title="Campus alerts" subtitle="Keep everyone informed about campus safety." />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <Card>
            <CardHeader title="Broadcast a new alert" subtitle="Sent as a push notification to every CampusSafe user" />
            <form onSubmit={review} className="space-y-4 p-4">
              <div>
                <p className="mb-2.5 text-[13px] font-semibold">Severity</p>
                <ChoiceChips options={SEVERITIES.map((s) => ({ value: s, label: severityName(s) }))} value={severity} onChange={setSeverity} />
              </div>
              <Field label="Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. Fire drill at 2 PM" required />
              </Field>
              <Field label="Message" hint={`${body.length}/1000`}>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={5} placeholder="What should students know or do?" required />
              </Field>
              <div>
                <p className="mb-2 text-[13px] font-semibold">Templates</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.title}
                      type="button"
                      onClick={() => { setTitle(t.title); setBody(t.body); setSeverity(t.severity) }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-outline px-3 text-sm font-medium hover:bg-ink/5"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" size="lg" variant={severity === 'Emergency' ? 'danger' : 'primary'} icon="campaign" className="w-full" disabled={!title.trim() || !body.trim()}>
                Review and send
              </Button>
            </form>
          </Card>
        </section>

        <section className="lg:col-span-3">
          <ChoiceChips options={[...FILTERS]} value={filter} onChange={setFilter} />
          <div className="mt-[18px]">
            {loading ? (
              <Spinner />
            ) : shown.length === 0 ? (
              <Card><EmptyState icon="notifications" title="No alerts here" body="Alerts you broadcast will be listed here." /></Card>
            ) : (
              shown.map((a) => (
                <AlertCard
                  key={a.id}
                  title={a.title}
                  body={a.body}
                  meta={`Sent by ${userName(ref.users, a.sentBy)} • ${timeAgo(a.sentAt, now)} (${formatDateTime(a.sentAt)})`}
                  severity={a.severity}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <Modal
        open={confirming}
        title="Send campus alert?"
        onClose={() => setConfirming(false)}
        footer={
          <>
            <Button variant="text" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant={severity === 'Emergency' ? 'danger' : 'filled'} className={severity === 'Emergency' ? '!rounded-full' : ''} loading={sending} onClick={send}>Send alert</Button>
          </>
        }
      >
        <p className="mb-4 text-muted">All {recipients} students and responders will receive this notification. It cannot be recalled.</p>
        <div className="rounded-card border border-line bg-background p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-bold">{title}</p>
            <SeverityBadge severity={severity} />
          </div>
          <p className="whitespace-pre-wrap">{body}</p>
        </div>
      </Modal>
    </div>
  )
}
