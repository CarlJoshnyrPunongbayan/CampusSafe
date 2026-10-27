export function Shield({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="currentColor" d="M16 2 4 7v8c0 7.2 5.1 13.6 12 15 6.9-1.4 12-7.8 12-15V7z" />
      <path fill="#fff" d="M14.5 9h3v8h-3zm0 10h3v3h-3z" />
    </svg>
  )
}
