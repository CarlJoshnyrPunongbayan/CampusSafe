import { FirebaseError } from 'firebase/app'
import { browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword } from 'firebase/auth'
import { BarChart3, Lock, Mail, Megaphone, ShieldCheck, Siren } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Button, Field, Input } from '../components/ui'
import { auth, usingEmulators } from '../lib/firebase'

function errorMessage(err: unknown) {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.'
      case 'auth/network-request-failed':
        return 'Network error. Check your connection.'
    }
  }
  return 'Sign-in failed. Please try again.'
}

const FEATURES = [
  { icon: Siren, title: 'Real-time incident queue', body: 'Reports and SOS requests appear within seconds, sorted by priority.' },
  { icon: Megaphone, title: 'Campus-wide alerts', body: 'Broadcast emergency notices to every CampusSafe user.' },
  { icon: BarChart3, title: 'Response analytics', body: 'Track acknowledgement and resolution times for better decisions.' },
]

export function LoginPage() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function onForgot() {
    setError(null)
    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setInfo('If an account exists for this email, a reset link has been sent.')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 text-white lg:flex">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue/40 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-control bg-white/10">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xl font-extrabold tracking-tight">CampusSafe</p>
            <p className="text-sm text-white/70">Security Office Dashboard</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-[34px] leading-tight font-extrabold tracking-tight">Faster response for a safer campus.</h2>
          <ul className="mt-8 space-y-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-white/10">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-sm text-white/70">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">Manuel S. Enverga University Foundation · College of Computing and Multimedia Studies</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-soft-blue">
              <ShieldCheck className="h-[38px] w-[38px] text-blue" />
            </span>
            <h1 className="mt-6 text-[28px] font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-muted">Sign in to the CampusSafe security dashboard</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field label="Email address">
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="security@mseuf.edu.ph"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11"
                />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11"
                />
              </div>
            </Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-navy" />
                Remember me
              </label>
              <button type="button" onClick={onForgot} className="font-medium text-blue hover:underline">
                Forgot?
              </button>
            </div>
            {error && <p role="alert" className="rounded-control bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>}
            {info && <p className="rounded-control bg-success/10 px-4 py-2.5 text-sm text-success">{info}</p>}
            <Button type="submit" loading={submitting} className="w-full !h-[50px]">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            For campus security office accounts only. Students and responders use the CampusSafe mobile app.
          </p>
          {usingEmulators && (
            <p className="mt-3 rounded-control bg-soft-blue px-4 py-2 text-center text-xs text-navy">
              Emulator mode · admin@campussafe.test / Admin123!
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
