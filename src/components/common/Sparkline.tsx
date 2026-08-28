interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  stroke?: string
}

export function Sparkline({ data, width = 96, height = 32, stroke = "#f97316" }: SparklineProps) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data
    .map((value, i) => {
      const x = i * step
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" role="img" aria-hidden="true">
      <polyline points={points} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
