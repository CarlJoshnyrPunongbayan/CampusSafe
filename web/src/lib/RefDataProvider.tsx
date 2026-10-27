import { collection, doc } from 'firebase/firestore'
import { useMemo, type ReactNode } from 'react'
import { db } from './firebase'
import { useCollection, useDocument } from './hooks'
import { RefDataContext } from './refData'
import type { AppConfig, IncidentType, LocationTag, UserProfile } from './types'

export function RefDataProvider({ children }: { children: ReactNode }) {
  const usersQ = useMemo(() => collection(db, 'users'), [])
  const typesQ = useMemo(() => collection(db, 'incidentTypes'), [])
  const tagsQ = useMemo(() => collection(db, 'locationTags'), [])
  const configRef = useMemo(() => doc(db, 'config', 'app'), [])

  const users = useCollection<UserProfile>(usersQ)
  const types = useCollection<IncidentType>(typesQ)
  const tags = useCollection<LocationTag>(tagsQ)
  const config = useDocument<AppConfig>(configRef)

  const value = useMemo(
    () => ({
      users: new Map(users.data.map((u) => [u.id, u])),
      incidentTypes: new Map(types.data.map((t) => [t.id, t])),
      locationTags: new Map(tags.data.map((t) => [t.id, t])),
      config: config.data ?? {},
      loading: users.loading || types.loading || tags.loading,
    }),
    [users, types, tags, config],
  )

  return <RefDataContext.Provider value={value}>{children}</RefDataContext.Provider>
}
