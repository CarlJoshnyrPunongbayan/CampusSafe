import { createContext, useContext } from 'react'
import type { Incident, WithId } from './types'

/** Live list of Pending and Responding incidents, shared by the layout and pages. */
export interface ActiveIncidents {
  incidents: WithId<Incident>[]
  loading: boolean
}

export const ActiveIncidentsContext = createContext<ActiveIncidents>({ incidents: [], loading: true })

export function useActiveIncidents() {
  return useContext(ActiveIncidentsContext)
}
