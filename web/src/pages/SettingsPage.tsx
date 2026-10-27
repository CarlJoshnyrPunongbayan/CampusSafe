import { doc, setDoc } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import { Button, Card, CardHeader, Field, IconTile, Input, PageHeader } from '../components/ui'
import { db } from '../lib/firebase'
import { useRefData } from '../lib/refData'
import { useToast } from '../lib/toast'

export function SettingsPage() {
  const { config, loading } = useRefData()
  if (loading) return null
  return <SettingsForm key={JSON.stringify(config)} hotline={config.securityHotline ?? ''} minutes={config.escalationMinutes ?? 2} />
}

function SettingsForm({ hotline: initialHotline, minutes: initialMinutes }: { hotline: string; minutes: number }) {
  const toast = useToast()
  const [hotline, setHotline] = useState(initialHotline)
  const [minutes, setMinutes] = useState(String(initialMinutes))
  const [saving, setSaving] = useState(false)

  const minutesNum = Number(minutes)
  const minutesValid = Number.isInteger(minutesNum) && minutesNum >= 1 && minutesNum <= 30
  const hotlineValid = /^[0-9+\-\s()]{7,20}$/.test(hotline.trim())

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'config', 'app'), { securityHotline: hotline.trim(), escalationMinutes: minutesNum }, { merge: true })
      toast({ tone: 'success', title: 'Settings saved' })
    } catch {
      toast({ tone: 'error', title: 'Could not save settings' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Options used by the mobile app and the escalation rule." />
      <form onSubmit={save} className="space-y-4">
        <Card>
          <CardHeader title="Security office hotline" />
          <div className="flex gap-4 p-4">
            <IconTile icon="call" tone="success" />
            <div className="flex-1">
              <Field label="Phone number" hint="Dialed when a student taps Call in the app (FR12)." error={hotline && !hotlineValid ? 'Enter a valid phone number' : undefined}>
                <Input value={hotline} onChange={(e) => setHotline(e.target.value)} placeholder="e.g. 0917 000 0000 or (042) 710 0000" />
              </Field>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Escalation rule" />
          <div className="flex gap-4 p-4">
            <IconTile icon="timer" tone="danger" />
            <div className="flex-1">
              <Field
                label="Escalate High-priority reports not acknowledged after (minutes)"
                hint="Escalated reports turn red and the security office is notified again. The study target is 2 minutes."
                error={!minutesValid ? 'Enter a whole number from 1 to 30' : undefined}
              >
                <Input type="number" min={1} max={30} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="!w-32" />
              </Field>
            </div>
          </div>
        </Card>
        <Button type="submit" size="lg" icon="save" className="w-full sm:w-auto" loading={saving} disabled={!minutesValid || !hotlineValid}>Save settings</Button>
      </form>
    </div>
  )
}
