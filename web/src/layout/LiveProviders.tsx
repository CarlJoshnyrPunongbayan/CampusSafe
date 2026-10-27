import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { ActiveIncidentsContext, type ActiveIncidents } from '../lib/activeIncidents'
import { playAlertSound } from '../lib/alertSound'
import { db } from '../lib/firebase'
import { incidentTitle } from '../lib/incidentLabels'
import { RefDataProvider } from '../lib/RefDataProvider'
import { useRefData } from '../lib/refData'
import { ToastContext, useToast, type Toast } from '../lib/toast'
import type { Incident, WithId } from '../lib/types'
import { Toaster } from './Toaster'

/**
 * Providers for signed-in pages: reference data, toasts and the live incident watcher.
 */
export function LiveProviders({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = nextId.current++
    setToasts((t) => [...t, { ...toast, id }].slice(-4))
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), toast.tone === 'urgent' ? 12_000 : 5_000)
  }, [])

  return (
    <RefDataProvider>
      <ToastContext.Provider value={push}>
        <IncidentWatcher>{children}</IncidentWatcher>
        <Toaster toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </ToastContext.Provider>
    </RefDataProvider>
  )
}

/**
 * Subscribes to Pending/Responding incidents for the whole dashboard and:
 *  - alerts the officer (sound + toast) for new High-priority or SOS reports and escalations,
 *  - records how long each new report took to appear (objective: ≤ 5 s, Table XII).
 */
function IncidentWatcher({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const ref = useRefData()
  const refRef = useRef(ref)
  useEffect(() => {
    refRef.current = ref
  }, [ref])
  const [state, setState] = useState<ActiveIncidents>({ incidents: [], loading: true })
  const push = useToast()

  useEffect(() => {
    if (!user) return
    const alerted = new Set<string>()
    const escalatedSeen = new Set<string>()
    let initialLoad = true

    const q = query(collection(db, 'incidents'), where('status', 'in', ['Pending', 'Responding']))
    return onSnapshot(q, (snap) => {
      const incidents = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Incident) }))
      setState({ incidents, loading: false })

      for (const change of snap.docChanges()) {
        const incident = { id: change.doc.id, ...(change.doc.data() as Incident) } as WithId<Incident>
        if (initialLoad) {
          alerted.add(incident.id)
          if (incident.escalated) escalatedSeen.add(incident.id)
          continue
        }
        if (change.type === 'added' && incident.createdAt && !change.doc.metadata.hasPendingWrites) {
          void addDoc(collection(db, 'metrics'), {
            kind: 'dashboard_display_ms',
            value: Date.now() - incident.createdAt.toMillis(),
            refId: incident.id,
            uid: user.uid,
            recordedAt: serverTimestamp(),
          }).catch(() => {})
        }
        const urgent = incident.isSOS || incident.priority === 'High'
        if (urgent && !alerted.has(incident.id)) {
          alerted.add(incident.id)
          playAlertSound(true)
          push({
            tone: 'urgent',
            title: `${incident.isSOS ? 'SOS request' : 'High priority report'}: ${incidentTitle(incident, refRef.current)}`,
            body: incident.description?.slice(0, 120) || 'Open the incident to respond.',
            href: `/incidents/${incident.id}`,
          })
        } else if (change.type === 'added' && !alerted.has(incident.id) && incident.priority) {
          alerted.add(incident.id)
          playAlertSound(false)
          push({ tone: 'info', title: `New ${incident.priority.toLowerCase()} priority report`, body: incidentTitle(incident, refRef.current), href: `/incidents/${incident.id}` })
        }
        if (incident.escalated && !escalatedSeen.has(incident.id)) {
          escalatedSeen.add(incident.id)
          playAlertSound(true)
          push({ tone: 'urgent', title: 'Escalated: report not acknowledged', body: incidentTitle(incident, refRef.current), href: `/incidents/${incident.id}` })
        }
      }
      initialLoad = false
    })
  }, [user, push])

  return <ActiveIncidentsContext.Provider value={state}>{children}</ActiveIncidentsContext.Provider>
}
