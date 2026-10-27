import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAdmin } from './auth/RequireAdmin'
import './index.css'
import { DashboardLayout } from './layout/DashboardLayout'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'incidents', element: <ComingSoonPage title="Incident Queue" step="sprint 2" /> },
          { path: 'alerts', element: <ComingSoonPage title="Broadcast Alerts" step="sprint 4" /> },
          { path: 'users', element: <ComingSoonPage title="Users" step="sprint 6" /> },
          { path: 'incident-types', element: <ComingSoonPage title="Incident Types" step="sprint 6" /> },
          { path: 'location-tags', element: <ComingSoonPage title="Location Tags" step="sprint 5" /> },
          { path: 'analytics', element: <ComingSoonPage title="Analytics" step="sprint 6" /> },
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
