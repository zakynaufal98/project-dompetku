export default function CashFlowKuLogo({ size = 44, rounded = 12, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CashFlowKu"
    >
      <rect width="48" height="48" rx={rounded} fill="#9fe870" />
      <line x1="8" y1="25" x2="18" y2="25" stroke="#0e0f0c" strokeWidth="4" strokeLinecap="round" />
      <line x1="8" y1="32" x2="18" y2="32" stroke="#0e0f0c" strokeWidth="4" strokeLinecap="round" />
      <polyline points="21,32 29,23 40,13" stroke="#0e0f0c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="40,13 31,15 38,22" fill="#0e0f0c" />
    </svg>
  )
}
