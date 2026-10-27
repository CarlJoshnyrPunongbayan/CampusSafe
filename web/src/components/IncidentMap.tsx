import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'
import { Icon } from './Icon'
import { googleMapsUrl } from '../lib/maps'
import type { GeoPoint } from '../lib/types'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

/** Google Map with the report's pin. Without an API key it shows the coordinates and a link instead. */
export function IncidentMap({ point, label }: { point: GeoPoint; label: string }) {
  if (!MAPS_KEY) {
    return (
      <div className="relative flex h-56 flex-col items-center justify-center overflow-hidden rounded-[18px] bg-soft-blue text-center">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-danger text-white"><Icon name="warning" size={22} /></span>
          <p className="mt-2 font-bold">{label}</p>
          <p className="text-xs text-muted">
            {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
          </p>
          <a href={googleMapsUrl(point)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/8">
            Open in Google Maps <Icon name="open_in_new" size={16} />
          </a>
          <p className="mt-2 text-[11px] text-muted">Set VITE_GOOGLE_MAPS_API_KEY to show the live map here.</p>
        </div>
      </div>
    )
  }
  return (
    <APIProvider apiKey={MAPS_KEY}>
      <div className="h-64 overflow-hidden rounded-[18px] border border-line">
        <Map defaultCenter={point} defaultZoom={18} gestureHandling="cooperative" disableDefaultUI zoomControl>
          <Marker position={point} title={label} />
        </Map>
      </div>
    </APIProvider>
  )
}
