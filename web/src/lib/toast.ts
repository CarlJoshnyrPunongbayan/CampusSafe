import { createContext, useContext } from 'react'

export type ToastTone = 'info' | 'success' | 'error' | 'urgent'

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  body?: string
  href?: string
}

export const ToastContext = createContext<(toast: Omit<Toast, 'id'>) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}
