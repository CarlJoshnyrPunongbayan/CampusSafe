import { useAuth } from '../auth/useAuth'

export function OverviewPage() {
  const { profile } = useAuth()
  return (
    <div>
      <h1 className="text-2xl font-bold">Overview</h1>
      <p className="mt-1 text-slate-600">Welcome{profile ? `, ${profile.name}` : ''}.</p>
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500">
        The live incident summary will appear here once incident reporting is built (Step 2 of the build plan).
      </div>
    </div>
  )
}
