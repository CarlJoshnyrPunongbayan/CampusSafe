import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { PriorityBadge, StatusBadge } from '../components/badges'
import { Icon } from '../components/Icon'
import { Avatar, Card, ChoiceChips, EmptyState, PageHeader, SectionHeader } from '../components/ui'
import { useActiveIncidents } from '../lib/activeIncidents'
import { timeAgo } from '../lib/format'
import { useNow } from '../lib/hooks'
import { compareQueue, incidentLocation, incidentTitle } from '../lib/incidentLabels'
import { useRefData } from '../lib/refData'
import type { Incident, LocationTag, WithId } from '../lib/types'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

type Layer = 'all' | 'incidents' | 'tags'
const LAYERS = [
  { value: 'all', label: 'All' },
  { value: 'incidents', label: 'Incidents' },
  { value: 'tags', label: 'QR tags' },
] as const

const markerTone = (i: Incident) => (i.isSOS || i.priority === 'High' ? 'danger' : i.priority === 'Medium' ? 'warning' : 'blue') as 'danger' | 'warning' | 'blue'

function pointOf(i: Incident, tags: Map<string, LocationTag>) {
  const tag = i.locationTagId ? tags.get(i.locationTagId) : undefined
  return tag ? { lat: tag.lat, lng: tag.lng } : i.location
}

/** The app's Campus map screen: filter chips, soft-blue grid map with markers, lists below. */
export function CampusMapPage() {
  const ref = useRefData()
  const now = useNow()
  const { incidents } = useActiveIncidents()
  const [layer, setLayer] = useState<Layer>('all')

  const located = useMemo(
    () => [...incidents].sort(compareQueue).map((i) => ({ incident: i, point: pointOf(i, ref.locationTags) })).filter((x): x is { incident: WithId<Incident>; point: { lat: number; lng: number } } => !!x.point),
    [incidents, ref.locationTags],
  )
  const tags = [...ref.locationTags.values()]
  const showIncidents = layer !== 'tags'
  const showTags = layer !== 'incidents'

  return (
    <div>
      <PageHeader title="Campus map" subtitle="Active incidents and QR location tags around campus." />
      <ChoiceChips options={[...LAYERS]} value={layer} onChange={setLayer} />
      <div className="mt-3">
        {MAPS_KEY ? (
          <GoogleCampusMap incidents={showIncidents ? located : []} tags={showTags ? tags : []} />
        ) : (
          <GridMap incidents={showIncidents ? located : []} tags={showTags ? tags : []} />
        )}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {showIncidents && (
          <section>
            <SectionHeader title="Active incidents" action="Open queue" to="/incidents" />
            {incidents.length === 0 ? (
              <Card><EmptyState icon="verified_user" title="No active incidents" /></Card>
            ) : (
              <Card>
                <ul className="divide-y divide-line">
                  {[...incidents].sort(compareQueue).map((i) => (
                    <li key={i.id}>
                      <Link to={`/incidents/${i.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-soft-blue/40">
                        <Icon name="warning_amber" className={markerTone(i) === 'danger' ? 'text-danger' : markerTone(i) === 'warning' ? 'text-warning' : 'text-blue'} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base">{incidentTitle(i, ref)}</p>
                          <p className="truncate text-sm text-muted">{incidentLocation(i, ref)} • {timeAgo(i.createdAt, now)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={i.status} />
                          <PriorityBadge priority={i.priority} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        )}
        {showTags && (
          <section>
            <SectionHeader title="QR location tags" action="Manage" to="/location-tags" />
            <Card>
              <ul className="divide-y divide-line">
                {tags.map((t) => (
                  <li key={t.id} className="flex items-center gap-4 px-4 py-3">
                    <Icon name="qr_code_2" className="text-success" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base">{t.name}</p>
                      <p className="truncate text-sm text-muted">{t.building} • Floor {t.floor}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}
      </div>
    </div>
  )
}

interface MapProps {
  incidents: { incident: WithId<Incident>; point: { lat: number; lng: number } }[]
  tags: WithId<LocationTag>[]
}

/** Schematic map in the app's style (soft-blue with a white grid), positioned by coordinates. */
function GridMap({ incidents, tags }: MapProps) {
  const ref = useRefData()
  const points = [...incidents.map((i) => i.point), ...tags]
  let bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null = null
  if (points.length > 0) {
    const lats = points.map((p) => p.lat)
    const lngs = points.map((p) => p.lng)
    const pad = 0.0004
    bounds = { minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad, minLng: Math.min(...lngs) - pad, maxLng: Math.max(...lngs) + pad }
  }

  // Markers at the same spot (e.g. several reports at one QR tag) are spread in a small circle.
  const groups: Record<string, string[]> = {}
  const keyOf = (p: { lat: number; lng: number }) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`
  for (const t of tags) (groups[keyOf(t)] ??= []).push(`t:${t.id}`)
  for (const { incident, point } of incidents) (groups[keyOf(point)] ??= []).push(`i:${incident.id}`)

  const place = (p: { lat: number; lng: number }, id: string) => {
    if (!bounds) return { left: '50%', top: '50%' }
    const x = (p.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)
    const y = 1 - (p.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)
    const group = groups[keyOf(p)] ?? [id]
    const k = group.indexOf(id)
    const angle = (2 * Math.PI * k) / group.length - Math.PI / 2
    const r = group.length > 1 ? 46 : 0
    return { left: `calc(${8 + x * 84}% + ${Math.round(Math.cos(angle) * r * 1.6)}px)`, top: `calc(${8 + y * 80}% + ${Math.round(Math.sin(angle) * r)}px)` }
  }

  return (
    <div className="relative h-[420px] overflow-hidden rounded-[18px] bg-soft-blue">
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      {tags.map((t) => (
        <div key={t.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={place(t, `t:${t.id}`)} title={t.name}>
          <Avatar icon="qr_code_2" tone="success" solid size={30} />
          <p className="mt-0.5 max-w-24 truncate text-[11px] font-bold">{t.name}</p>
        </div>
      ))}
      {incidents.map(({ incident, point }) => (
        <Link key={incident.id} to={`/incidents/${incident.id}`} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center" style={place(point, `i:${incident.id}`)} title={incidentTitle(incident, ref)}>
          <span className="relative inline-flex">
            {(incident.isSOS || incident.priority === 'High') && incident.status === 'Pending' && <span className="absolute inset-0 animate-ping rounded-full bg-danger/50" />}
            <Avatar icon={incident.isSOS ? 'sos' : 'warning'} tone={markerTone(incident)} solid />
          </span>
          <p className="mt-0.5 max-w-28 truncate text-[11px] font-bold">{incidentTitle(incident, ref)}</p>
        </Link>
      ))}
      {points.length === 0 && <p className="absolute inset-0 flex items-center justify-center text-muted">Nothing to show</p>}
      <div className="absolute right-3 bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-xl bg-white/90 px-3 py-2 text-[11px] font-bold sm:right-auto">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-danger" />High / SOS</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-warning" />Medium</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue" />Low</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-success" />QR tag</span>
        <span className="font-medium text-muted">Schematic view · add a Google Maps key for the street map</span>
      </div>
    </div>
  )
}

function GoogleCampusMap({ incidents, tags }: MapProps) {
  const center = incidents[0]?.point ?? (tags[0] ? { lat: tags[0].lat, lng: tags[0].lng } : { lat: 13.9411, lng: 121.6139 })
  return (
    <APIProvider apiKey={MAPS_KEY!}>
      <div className="h-[420px] overflow-hidden rounded-[18px] border border-line">
        <Map defaultCenter={center} defaultZoom={17} gestureHandling="cooperative" disableDefaultUI zoomControl>
          {tags.map((t) => <Marker key={t.id} position={{ lat: t.lat, lng: t.lng }} title={t.name} />)}
          {incidents.map(({ incident, point }) => <Marker key={incident.id} position={point} title={incident.description} />)}
        </Map>
      </div>
    </APIProvider>
  )
}
