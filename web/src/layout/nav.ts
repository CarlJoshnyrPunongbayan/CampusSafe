// Navigation destinations. On phones the first four plus "More" form the bottom
// NavigationBar, exactly like CampusBottomNavigation in the mobile app.
// On wider screens all of them sit in a Material navigation rail.
export const NAV = [
  { to: '/', label: 'Home', icon: 'home', end: true, primary: true },
  { to: '/incidents', label: 'Incidents', icon: 'report', primary: true, badge: true },
  { to: '/alerts', label: 'Alerts', icon: 'notifications', primary: true },
  { to: '/map', label: 'Map', icon: 'map', primary: true },
  { to: '/analytics', label: 'Analytics', icon: 'insights' },
  { to: '/users', label: 'Users', icon: 'group' },
  { to: '/incident-types', label: 'Types', icon: 'category' },
  { to: '/location-tags', label: 'QR tags', icon: 'qr_code_2' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]
