import { ShieldAlert } from 'lucide-react'
import { Button, IconTile } from '../components/ui'

interface Props {
  title: string
  body?: string
  action?: { label: string; onClick: () => void }
}

export function FullPageMessage({ title, body, action }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="flex justify-center">
          <IconTile icon={ShieldAlert} />
        </div>
        <h1 className="mt-4 text-xl font-bold">{title}</h1>
        {body && <p className="mt-2 text-muted">{body}</p>}
        {action && (
          <Button className="mt-6" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
