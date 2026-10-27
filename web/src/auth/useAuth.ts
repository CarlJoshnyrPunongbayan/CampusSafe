import type { User } from 'firebase/auth'
import { signOut } from 'firebase/auth'
import { createContext, useContext } from 'react'
import { auth } from '../lib/firebase'
import type { Role, UserProfile } from '../lib/types'

export interface AuthState {
  loading: boolean
  user: User | null
  // Role from the ID token's custom claim. This is what Security Rules check.
  role: Role | null
  profile: UserProfile | null
}

export const AuthContext = createContext<AuthState>({ loading: true, user: null, role: null, profile: null })

export function useAuth() {
  return useContext(AuthContext)
}

export function logout() {
  return signOut(auth)
}
