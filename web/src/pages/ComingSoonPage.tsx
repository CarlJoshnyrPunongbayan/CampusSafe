export function ComingSoonPage({ title, step }: { title: string; step: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500">
        Not built yet. Planned for {step}.
      </div>
    </div>
  )
}
