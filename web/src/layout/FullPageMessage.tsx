import { Icon } from '../components/Icon'
import { Button } from '../components/ui'

interface Props {
  title: string
  body?: string
  action?: { label: string; onClick: () => void }
}

export function FullPageMessage({ title, body, action }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-[440px] text-center">
        <div className="flex justify-center">
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-soft-blue">
            <Icon name="gpp_maybe" size={38} className="text-blue" />
          </span>
        </div>
        <h1 className="mt-6 text-[28px] font-bold tracking-[-0.5px]">{title}</h1>
        {body && <p className="mt-2 text-muted">{body}</p>}
        {action && (
          <Button size="lg" className="mt-8 w-full" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
