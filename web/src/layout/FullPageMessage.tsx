interface Props {
  title: string
  body?: string
  action?: { label: string; onClick: () => void }
}

export function FullPageMessage({ title, body, action }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        {body && <p className="mt-2 text-slate-600">{body}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
