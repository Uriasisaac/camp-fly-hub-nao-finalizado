interface ProgressBarProps {
  label: string
  value: number
  max: number
  unit?: string
  color?: string
  formatValue?: (v: number) => string
  formatMax?: (v: number) => string
}

export default function ProgressBar({
  label,
  value,
  max,
  color = '#AAFF00',
  formatValue,
  formatMax,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const displayValue = formatValue ? formatValue(value) : String(value)
  const displayMax = formatMax ? formatMax(max) : String(max)

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-[#888]">{label}</span>
        <span className="font-bold tabular-nums text-white">
          {displayValue}{' '}
          <span className="font-normal text-[#555]">/ {displayMax}</span>
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[#1A1A1A]"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
