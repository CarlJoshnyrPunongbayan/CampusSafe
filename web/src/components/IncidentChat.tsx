import { addDoc, collection, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { MessageSquare, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { db } from '../lib/firebase'
import { formatDateTime } from '../lib/format'
import { useCollection } from '../lib/hooks'
import { userName, useRefData } from '../lib/refData'
import { useToast } from '../lib/toast'
import type { ChatMessage } from '../lib/types'
import { RoleBadge } from './badges'
import { Button, Card, CardHeader, EmptyState, Input } from './ui'

/** Chat between the security office, the reporter and the assigned responder (FR17). */
export function IncidentChat({ incidentId, disabled }: { incidentId: string; disabled?: boolean }) {
  const { user } = useAuth()
  const ref = useRefData()
  const toast = useToast()
  const q = useMemo(() => query(collection(db, 'incidents', incidentId, 'messages'), orderBy('sentAt')), [incidentId])
  const { data: messages } = useCollection<ChatMessage>(q)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  async function send(e: FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !user) return
    setSending(true)
    try {
      await addDoc(collection(db, 'incidents', incidentId, 'messages'), { senderId: user.uid, text: body, sentAt: serverTimestamp() })
      setText('')
    } catch {
      toast({ tone: 'error', title: 'Message not sent', body: 'Check your connection and try again.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Chat with reporter" subtitle="Messages appear in the reporter's CampusSafe app" />
      <div ref={listRef} className="max-h-80 min-h-40 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages yet" body="Ask for details or give safety instructions." />
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.uid
            const sender = ref.users.get(m.senderId)
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                  <span className="font-bold text-ink">{mine ? 'You' : userName(ref.users, m.senderId)}</span>
                  {sender && !mine && <RoleBadge role={sender.role} />}
                  <span>{formatDateTime(m.sentAt)}</span>
                </div>
                <p className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${mine ? 'rounded-br-md bg-navy text-white' : 'rounded-bl-md bg-background'}`}>
                  {m.text}
                </p>
              </div>
            )
          })
        )}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? 'This incident is resolved' : 'Type a message…'}
          maxLength={1000}
          disabled={disabled}
          aria-label="Message"
        />
        <Button type="submit" icon={Send} loading={sending} disabled={disabled || !text.trim()} aria-label="Send">
          <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
    </Card>
  )
}
