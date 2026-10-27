import type { Timestamp } from 'firebase/firestore'

// Firestore data model. Keep in sync with docs/data-model.md and firestore.rules.

export type Role = 'student' | 'responder' | 'admin'
export type Priority = 'High' | 'Medium' | 'Low'
export type IncidentStatus = 'Pending' | 'Responding' | 'Resolved'
export type AlertSeverity = 'Info' | 'Warning' | 'Emergency'

export interface UserProfile {
  name: string
  studentId?: string
  email: string
  mobileNo: string
  role: Role
  fcmToken?: string
  createdAt: Timestamp
  roleUpdatedAt?: Timestamp
}

export interface IncidentType {
  name: string
  defaultPriority: Priority
  keywords: string[]
  active: boolean
}

export interface LocationTag {
  name: string
  building: string
  floor: string
  lat: number
  lng: number
}

export interface GeoPoint {
  lat: number
  lng: number
  accuracy?: number
}

export interface Incident {
  reporterId: string
  typeId: string
  description: string
  photoUrls: string[]
  isSOS: boolean
  location: GeoPoint | null
  locationTagId: string | null
  status: IncidentStatus
  priority?: Priority
  priorityConfirmed?: boolean
  assignedResponderId?: string | null
  escalated?: boolean
  clientCreatedAt: Timestamp
  createdAt: Timestamp
  acknowledgedAt?: Timestamp
  respondingAt?: Timestamp
  resolvedAt?: Timestamp
}

export interface ChatMessage {
  senderId: string
  text: string
  sentAt: Timestamp
}

export interface Alert {
  title: string
  body: string
  severity: AlertSeverity
  sentBy: string
  sentAt: Timestamp
}

export type WithId<T> = T & { id: string }
