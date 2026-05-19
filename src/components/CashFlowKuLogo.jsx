export default function CashFlowKuLogo({ size = 44, rounded = 12, className = '' }) {
  return (
    <img
      src="/logo-cashflowku.png"
      alt="CashFlowKu"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        objectFit: 'cover',
        display: 'block',
        flexShrink: 0,
      }}
    />
  )
}
