import { onIdTokenChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState, type ReactNode } from 'react'
import { auth, db } from '../lib/firebase'
import type { Role, UserProfile } from '../lib/types'
import { AuthContext, type AuthState } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ loading: true, user: null, role: null, profile: null })

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined
    let lastRoleUpdate: number | undefined

    const unsubscribeAuth = onIdTokenChanged(auth, async (user) => {
      unsubscribeProfile?.()
      unsubscribeProfile = undefined
      if (!user) {
        setState({ loading: false, user: null, role: null, profile: null })
        return
      }
      const token = await user.getIdTokenResult()
      const role = (token.claims.role as Role | undefined) ?? 'student'
      setState((s) => ({ ...s, loading: false, user, role }))

      unsubscribeProfile = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          const profile = (snap.data() as UserProfile | undefined) ?? null
          setState((s) => ({ ...s, profile }))
          // setUserRole bumps roleUpdatedAt; refresh the token so the new claim applies.
          const updated = profile?.roleUpdatedAt?.toMillis()
          if (updated && lastRoleUpdate !== undefined && updated !== lastRoleUpdate) {
            void user.getIdToken(true)
          }
          lastRoleUpdate = updated ?? 0
        },
        () => setState((s) => ({ ...s, profile: null })),
      )
    })

    return () => {
      unsubscribeProfile?.()
      unsubscribeAuth()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
