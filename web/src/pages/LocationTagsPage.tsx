import { addDoc, collection, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { MapPin, Pencil, Plus, Printer, QrCode, Trash2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState, type FormEvent } from 'react'
import { Banner, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Spinner } from '../components/ui'
import { db } from '../lib/firebase'
import { googleMapsUrl } from '../lib/maps'
import { qrPayload } from '../lib/qr'
import { useRefData } from '../lib/refData'
import { useToast } from '../lib/toast'
import type { LocationTag, WithId } from '../lib/types'

const EMPTY = { name: '', building: '', floor: '', lat: '', lng: '' }
type FormState = typeof EMPTY

export function LocationTagsPage() {
  const { locationTags, loading } = useRefData()
  const [editing, setEditing] = useState<{ id: string | null; data: FormState } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [printing, setPrinting] = useState<WithId<LocationTag>[] | null>(null)
  const tags = [...locationTags.values()].sort((a, b) => a.building.localeCompare(b.building) || a.name.localeCompare(b.name))

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <div>
      <PageHeader
        title="Location Tags"
        subtitle="QR codes posted around campus. Students scan them to report an exact indoor location."
        actions={
          <>
            <Button variant="secondary" icon={Printer} disabled={tags.length === 0} onClick={() => setPrinting(selected.size ? tags.filter((t) => selected.has(t.id)) : tags)}>
              Print {selected.size ? `${selected.size} selected` : 'all'}
            </Button>
            <Button icon={Plus} onClick={() => setEditing({ id: null, data: EMPTY })}>Add tag</Button>
          </>
        }
      />

      <div className="mb-5">
        <Banner icon={QrCode} title="QR-based campus location tagging" body="GPS is often inaccurate indoors. A scanned tag gives security the building, floor and exact spot of the report." />
      </div>

      {loading ? (
        <Spinner />
      ) : tags.length === 0 ? (
        <Card><EmptyState icon={MapPin} title="No location tags yet" body="Add the buildings and rooms where QR codes will be posted." /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tags.map((t) => (
            <Card key={t.id} className={`p-[17px] ${selected.has(t.id) ? 'ring-2 ring-blue' : ''}`}>
              <div className="flex gap-4">
                <div className="shrink-0 rounded-control border border-line bg-white p-2">
                  <QRCodeSVG value={qrPayload(t.id)} size={84} fgColor="#16315F" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{t.name}</p>
                  <p className="text-sm text-muted">{t.building} · Floor {t.floor}</p>
                  <a href={googleMapsUrl(t)} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue hover:underline">
                    {t.lat.toFixed(5)}, {t.lng.toFixed(5)}
                  </a>
                  <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="accent-navy" /> Select for printing
                  </label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Pencil}
                  aria-label={`Edit ${t.name}`}
                  onClick={() => setEditing({ id: t.id, data: { name: t.name, building: t.building, floor: t.floor, lat: String(t.lat), lng: String(t.lng) } })}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && <TagForm initial={editing} onClose={() => setEditing(null)} />}
      {printing && <PrintSheet tags={printing} onClose={() => setPrinting(null)} />}
    </div>
  )
}

function TagForm({ initial, onClose }: { initial: { id: string | null; data: FormState }; onClose: () => void }) {
  const toast = useToast()
  const [data, setData] = useState(initial.data)
  const [saving, setSaving] = useState(false)
  const set = (key: keyof FormState) => (e: { target: { value: string } }) => setData({ ...data, [key]: e.target.value })

  const lat = Number(data.lat)
  const lng = Number(data.lng)
  const coordsValid = data.lat !== '' && data.lng !== '' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setData((d) => ({ ...d, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })),
      () => toast({ tone: 'error', title: 'Location unavailable', body: 'Allow location access or enter the coordinates.' }),
      { enableHighAccuracy: true },
    )
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!coordsValid) return
    setSaving(true)
    const payload: LocationTag = { name: data.name.trim(), building: data.building.trim(), floor: data.floor.trim(), lat, lng }
    try {
      if (initial.id) await setDoc(doc(db, 'locationTags', initial.id), payload)
      else await addDoc(collection(db, 'locationTags'), payload)
      toast({ tone: 'success', title: initial.id ? 'Location tag updated' : 'Location tag added' })
      onClose()
    } catch {
      toast({ tone: 'error', title: 'Could not save location tag' })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!initial.id || !confirm('Delete this tag? Printed QR codes for it will stop working.')) return
    try {
      await deleteDoc(doc(db, 'locationTags', initial.id))
      toast({ tone: 'success', title: 'Location tag deleted' })
      onClose()
    } catch {
      toast({ tone: 'error', title: 'Could not delete location tag' })
    }
  }

  return (
    <Modal
      open
      title={initial.id ? 'Edit location tag' : 'Add location tag'}
      onClose={onClose}
      footer={
        <>
          {initial.id && <Button variant="ghost" icon={Trash2} className="mr-auto !text-danger" onClick={remove}>Delete</Button>}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="tag-form" loading={saving} disabled={!data.name.trim() || !data.building.trim() || !coordsValid}>Save</Button>
        </>
      }
    >
      <form id="tag-form" onSubmit={save} className="space-y-4">
        <Field label="Name" hint="Shown to students and security, e.g. Library, 2nd Floor Reading Area">
          <Input value={data.name} onChange={set('name')} required maxLength={80} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Building">
            <Input value={data.building} onChange={set('building')} required maxLength={60} />
          </Field>
          <Field label="Floor">
            <Input value={data.floor} onChange={set('floor')} maxLength={10} placeholder="G, 1, 2…" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <Input value={data.lat} onChange={set('lat')} inputMode="decimal" placeholder="13.94…" required />
          </Field>
          <Field label="Longitude">
            <Input value={data.lng} onChange={set('lng')} inputMode="decimal" placeholder="121.61…" required />
          </Field>
        </div>
        <Button type="button" variant="secondary" icon={MapPin} onClick={useMyLocation} className="w-full">
          Use this device's current location
        </Button>
      </form>
    </Modal>
  )
}

function PrintSheet({ tags, onClose }: { tags: WithId<LocationTag>[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="no-print sticky top-0 flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <p className="font-bold">Print preview · {tags.length} tag{tags.length > 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button icon={Printer} onClick={() => window.print()}>Print</Button>
        </div>
      </div>
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 p-8 print:p-0">
        {tags.map((t) => (
          <div key={t.id} className="flex break-inside-avoid flex-col items-center rounded-card border-2 border-navy p-6 text-center">
            <p className="text-sm font-extrabold tracking-wide text-navy uppercase">CampusSafe</p>
            <p className="text-xs text-muted">Scan to report an incident here</p>
            <div className="my-4">
              <QRCodeSVG value={qrPayload(t.id)} size={180} fgColor="#16315F" level="M" />
            </div>
            <p className="text-lg font-bold">{t.name}</p>
            <p className="text-sm text-muted">{t.building} · Floor {t.floor}</p>
            <p className="mt-3 text-xs text-muted">Emergency? Open CampusSafe and press SOS.</p>
          </div>
        ))}
      </div>
    </div>
  )
}
