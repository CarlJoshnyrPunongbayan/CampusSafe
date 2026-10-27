import { createContext, useContext } from 'react'
import type { AppConfig, IncidentType, LocationTag, UserProfile, WithId } from './types'

/** Reference data shared by all pages, loaded once by RefDataProvider. */
export interface RefData {
  users: Map<string, WithId<UserProfile>>
  incidentTypes: Map<string, WithId<IncidentType>>
  locationTags: Map<string, WithId<LocationTag>>
  config: AppConfig
  loading: boolean
}

export const RefDataContext = createContext<RefData>({
  users: new Map(),
  incidentTypes: new Map(),
  locationTags: new Map(),
  config: {},
  loading: true,
})

export function useRefData() {
  return useContext(RefDataContext)
}

export function userName(users: RefData['users'], uid: string | null | undefined): string {
  if (!uid) return '—'
  if (uid === 'system') return 'System'
  return users.get(uid)?.name ?? 'Unknown user'
}
