import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'
import { ExternalLink, MapPin } from 'lucide-react'
import { googleMapsUrl } from '../lib/maps'
import type { GeoPoint } from '../lib/types'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

/** Google Map with the report's pin. Without an API key it shows the coordinates and a link instead. */
export function IncidentMap({ point, label }: { point: GeoPoint; label: string }) {
  if (!MAPS_KEY) {
    return (
      <div className="relative flex h-56 flex-col items-center justify-center overflow-hidden rounded-control border border-line bg-soft-blue text-center">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'linear-gradient(#d5e2f7 1px, transparent 1px), linear-gradient(90deg, #d5e2f7 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative">
          <MapPin className="mx-auto h-9 w-9 fill-danger/20 text-danger" />
          <p className="mt-2 font-bold">{label}</p>
          <p className="text-xs text-muted">
            {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
          </p>
          <a href={googleMapsUrl(point)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-blue hover:underline">
            Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <p className="mt-2 text-[11px] text-muted">Set VITE_GOOGLE_MAPS_API_KEY to show the live map here.</p>
        </div>
      </div>
    )
  }
  return (
    <APIProvider apiKey={MAPS_KEY}>
      <div className="h-64 overflow-hidden rounded-control border border-line">
        <Map defaultCenter={point} defaultZoom={18} gestureHandling="cooperative" disableDefaultUI zoomControl>
          <Marker position={point} title={label} />
        </Map>
      </div>
    </APIProvider>
  )
}
