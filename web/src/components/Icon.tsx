/**
 * A Material icon, using the same names as Flutter's `Icons` (e.g. "shield" for Icons.shield_outlined,
 * or filled for Icons.shield). Outlined by default, like the mobile app.
 */
export function Icon({ name, filled, size = 24, className = '', label }: { name: string; filled?: boolean; size?: number; className?: string; label?: string }) {
  return (
    <span
      className={`mi ${filled ? 'mi-filled' : ''} ${className}`}
      style={{ fontSize: size }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  )
}
