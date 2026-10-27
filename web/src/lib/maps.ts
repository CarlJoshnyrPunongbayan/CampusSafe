import type { GeoPoint } from './types'

export function googleMapsUrl(point: Pick<GeoPoint, 'lat' | 'lng'>) {
  return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`
}
