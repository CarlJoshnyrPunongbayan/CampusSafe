import { addDoc, collection, doc, setDoc } from 'firebase/firestore'
import { Pencil, Plus, Tags, X } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { PriorityBadge } from '../components/badges'
import { Banner, Button, Card, Chip, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner } from '../components/ui'
import { db } from '../lib/firebase'
import { useRefData } from '../lib/refData'
import { useToast } from '../lib/toast'
import type { IncidentType, Priority, WithId } from '../lib/types'

const EMPTY: IncidentType = { name: '', defaultPriority: 'Medium', keywords: [], active: true }

export function IncidentTypesPage() {
  const { incidentTypes, loading } = useRefData()
  const [editing, setEditing] = useState<{ id: string | null; data: IncidentType } | null>(null)
  const types = [...incidentTypes.values()].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))

  return (
    <div>
      <PageHeader
        title="Incident Types"
        subtitle="The categories students choose from, and the rules used for automatic priority tagging."
        actions={<Button icon={Plus} onClick={() => setEditing({ id: null, data: EMPTY })}>Add type</Button>}
      />

      <div className="mb-5">
        <Banner
          icon={Tags}
          title="How rule-based priority tagging works"
          body="SOS requests are always High. If the description contains one of a type's keywords, the report becomes High. Otherwise the type's default priority is used. Officers confirm or change it on each report."
        />
      </div>

      {loading ? (
        <Spinner />
      ) : types.length === 0 ? (
        <Card><EmptyState icon={Tags} title="No incident types yet" body="Add the categories students can report." /></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {types.map((t) => (
            <TypeCard key={t.id} type={t} onEdit={() => setEditing({ id: t.id, data: { name: t.name, defaultPriority: t.defaultPriority, keywords: t.keywords ?? [], active: t.active } })} />
          ))}
        </div>
      )}

      {editing && <TypeForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function TypeCard({ type, onEdit }: { type: WithId<IncidentType>; onEdit: () => void }) {
  return (
    <Card className={`p-[17px] ${type.active ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-bold">{type.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted">Default</span>
            <PriorityBadge priority={type.defaultPriority} />
            {!type.active && <Chip tone="muted">Hidden</Chip>}
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={Pencil} onClick={onEdit} aria-label={`Edit ${type.name}`} />
      </div>
      <p className="mt-4 mb-1.5 text-xs font-bold text-muted">Keywords that raise to High</p>
      <div className="flex flex-wrap gap-1.5">
        {type.keywords?.length ? type.keywords.map((k) => <Chip key={k} tone="danger">{k}</Chip>) : <span className="text-xs text-muted">None</span>}
      </div>
    </Card>
  )
}

function TypeForm({ initial, onClose }: { initial: { id: string | null; data: IncidentType }; onClose: () => void }) {
  const toast = useToast()
  const [data, setData] = useState(initial.data)
  const [keyword, setKeyword] = useState('')
  const [saving, setSaving] = useState(false)

  function addKeyword() {
    const k = keyword.trim().toLowerCase()
    if (k && !data.keywords.includes(k)) setData({ ...data, keywords: [...data.keywords, k] })
    setKeyword('')
  }

  function onKeywordKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addKeyword()
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...data, name: data.name.trim() }
    try {
      if (initial.id) await setDoc(doc(db, 'incidentTypes', initial.id), payload)
      else await addDoc(collection(db, 'incidentTypes'), payload)
      toast({ tone: 'success', title: initial.id ? 'Incident type updated' : 'Incident type added' })
      onClose()
    } catch {
      toast({ tone: 'error', title: 'Could not save incident type' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title={initial.id ? 'Edit incident type' : 'Add incident type'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="type-form" loading={saving} disabled={!data.name.trim()}>Save</Button>
        </>
      }
    >
      <form id="type-form" onSubmit={save} className="space-y-4">
        <Field label="Name">
          <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} maxLength={60} placeholder="e.g. Medical Emergency" required />
        </Field>
        <Field label="Default priority">
          <Select value={data.defaultPriority} onChange={(e) => setData({ ...data, defaultPriority: e.target.value as Priority })}>
            <option value="High">High: immediate danger to life or property</option>
            <option value="Medium">Medium: needs prompt attention</option>
            <option value="Low">Low: can be handled in normal rounds</option>
          </Select>
        </Field>
        <Field label="Keywords" hint="Press Enter after each keyword. A match in the description makes the report High priority.">
          <div className="flex gap-2">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={onKeywordKey} placeholder="e.g. unconscious" />
            <Button type="button" variant="secondary" onClick={addKeyword}>Add</Button>
          </div>
        </Field>
        {data.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.keywords.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setData({ ...data, keywords: data.keywords.filter((x) => x !== k) })}
                className="inline-flex items-center gap-1 rounded-full bg-danger/12 px-2.5 py-1 text-xs font-bold text-danger"
              >
                {k} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
        <label className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
          <input type="checkbox" checked={data.active} onChange={(e) => setData({ ...data, active: e.target.checked })} className="h-4 w-4 accent-navy" />
          <span>
            <span className="block text-sm font-bold">Show in the mobile app</span>
            <span className="block text-xs text-muted">Hide types you no longer use instead of deleting them, so past reports keep their category.</span>
          </span>
        </label>
      </form>
    </Modal>
  )
}
