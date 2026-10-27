import { onSnapshot, type DocumentReference, type Query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import type { WithId } from './types'

interface LiveState<T> {
  data: T
  loading: boolean
  error: Error | null
}

/**
 * Live Firestore query. Pass a memoized query (useMemo) so it is not re-subscribed every render.
 * `null` means "not ready yet" and yields an empty list.
 */
export function useCollection<T>(query: Query | null): LiveState<WithId<T>[]> {
  const [state, setState] = useState<LiveState<WithId<T>[]>>({ data: [], loading: true, error: null })
  useEffect(() => {
    if (!query) return
    return onSnapshot(
      query,
      (snap) => setState({ data: snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })), loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    )
  }, [query])
  return state
}

export function useDocument<T>(ref: DocumentReference | null): LiveState<WithId<T> | null> {
  const [state, setState] = useState<LiveState<WithId<T> | null>>({ data: null, loading: true, error: null })
  useEffect(() => {
    if (!ref) return
    return onSnapshot(
      ref,
      (snap) => setState({ data: snap.exists() ? { id: snap.id, ...(snap.data() as T) } : null, loading: false, error: null }),
      (error) => setState({ data: null, loading: false, error }),
    )
  }, [ref])
  return state
}

/** Re-renders every `intervalMs` so relative times ("3 min ago") stay current. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
