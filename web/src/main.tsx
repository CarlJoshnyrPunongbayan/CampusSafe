import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAdmin } from './auth/RequireAdmin'
import './index.css'
import { DashboardLayout } from './layout/DashboardLayout'
import { AlertsPage } from './pages/AlertsPage'
import { CampusMapPage } from './pages/CampusMapPage'
import { IncidentDetailPage } from './pages/IncidentDetailPage'
import { IncidentQueuePage } from './pages/IncidentQueuePage'
import { IncidentTypesPage } from './pages/IncidentTypesPage'
import { LazyAnalyticsPage, LazyLocationTagsPage } from './pages/lazyPages'
import { LoginPage } from './pages/LoginPage'
import { MorePage } from './pages/MorePage'
import { OverviewPage } from './pages/OverviewPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { UsersPage } from './pages/UsersPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'incidents', element: <IncidentQueuePage /> },
          { path: 'incidents/:id', element: <IncidentDetailPage /> },
          { path: 'alerts', element: <AlertsPage /> },
          { path: 'map', element: <CampusMapPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'more', element: <MorePage /> },
          { path: 'analytics', element: <LazyAnalyticsPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'incident-types', element: <IncidentTypesPage /> },
          { path: 'location-tags', element: <LazyLocationTagsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
