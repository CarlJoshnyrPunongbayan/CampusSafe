import { useAuth } from '../auth/useAuth'
import { Icon } from '../components/Icon'
import { Card, ListTile, PageHeader } from '../components/ui'
import { NAV } from '../layout/nav'

/** Phone-only menu for the pages that do not fit in the bottom navigation bar. */
export function MorePage() {
  const { profile } = useAuth()
  return (
    <div>
      <PageHeader title="More" subtitle="Management and reports" />
      <Card>
        <ul className="divide-y divide-line">
          <li>
            <ListTile
              to="/profile"
              leading={<Icon name="person" className="text-muted" />}
              title="Profile"
              subtitle={profile?.name}
              trailing={<Icon name="chevron_right" className="text-muted" />}
            />
          </li>
          {NAV.filter((n) => !n.primary).map((n) => (
            <li key={n.to}>
              <ListTile to={n.to} leading={<Icon name={n.icon} className="text-muted" />} title={n.label} trailing={<Icon name="chevron_right" className="text-muted" />} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
