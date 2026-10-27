import { lazy, Suspense } from 'react'
import { Spinner } from '../components/ui'

// Heavier pages (charts, QR codes) are downloaded on first visit.
const Analytics = lazy(() => import('./AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const LocationTags = lazy(() => import('./LocationTagsPage').then((m) => ({ default: m.LocationTagsPage })))

export function LazyAnalyticsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Analytics />
    </Suspense>
  )
}

export function LazyLocationTagsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LocationTags />
    </Suspense>
  )
}
