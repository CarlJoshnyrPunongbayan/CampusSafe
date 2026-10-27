import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageMessage } from '../layout/FullPageMessage'
import { SplashScreen } from '../layout/SplashScreen'
import { logout, useAuth } from './useAuth'

// The web dashboard is for the security office (admin role) only.
// Students and responders use the mobile app.
export function RequireAdmin() {
  const { loading, user, role } = useAuth()
  const location = useLocation()

  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role !== 'admin') {
    return (
      <FullPageMessage
        title="Security office only"
        body="The web dashboard is for campus security office accounts. Students and responders should use the CampusSafe mobile app."
        action={{ label: 'Log out', onClick: () => void logout() }}
      />
    )
  }
  return <Outlet />
}
