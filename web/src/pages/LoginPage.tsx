import { FirebaseError } from 'firebase/app'
import { browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Icon } from '../components/Icon'
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

/** Same layout as the app's LoginScreen. */
export function LoginPage() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
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
      setInfo('Reset link requested. Check your email.')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-soft-blue">
            <Icon name="shield" size={38} className="text-blue" />
          </span>
          <h1 className="mt-6 text-[28px] leading-[1.15] font-bold tracking-[-0.5px]">Welcome back</h1>
          <p className="mt-[7px] text-muted">Sign in to continue to CampusSafe Security</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8">
          <Field label="Email address">
            <Input id="email" icon="mail" type="email" autoComplete="username" placeholder="security@mseuf.edu.ph" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <div className="h-4" />
          <Field label="Password">
            <Input id="password" icon="lock" type="password" autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <div className="my-2 flex items-center">
            <label className="flex cursor-pointer items-center gap-3 py-2 text-sm">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-[18px] w-[18px] accent-navy" />
              Remember me
            </label>
            <div className="flex-1" />
            <Button type="button" variant="text" size="sm" onClick={onForgot}>Forgot?</Button>
          </div>
          {error && <p role="alert" className="mb-3 rounded-control bg-danger-soft px-4 py-2.5 text-sm text-danger">{error}</p>}
          {info && <p className="mb-3 rounded-control bg-success/12 px-4 py-2.5 text-sm text-success">{info}</p>}
          <Button type="submit" size="lg" loading={submitting} className="w-full">Sign in</Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          For campus security office accounts. Students and responders use the CampusSafe mobile app.
        </p>
        {usingEmulators && (
          <p className="mt-4 rounded-[14px] bg-soft-blue px-4 py-3 text-center text-xs text-navy">
            Emulator mode · admin@campussafe.test / Admin123!
          </p>
        )}
      </div>
    </div>
  )
}
