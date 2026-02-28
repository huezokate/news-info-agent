import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const MAX_DAYS = 5

// Chart accent colours — all verified AA on white
const CHART_COLORS = [
  '#AD1457', // magenta
  '#00695C', // teal
  '#E65100', // burnt orange
  '#4527A0', // deep purple
  '#1565C0', // deep blue
]

const styles = {
  container: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
    height: '100%',
  },
  subtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: '0.75rem',
    fontWeight: '500',
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    textAlign: 'center',
    padding: '3rem 0',
  },
  tooltip: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.6rem 0.9rem',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  tooltipLabel: {
    fontWeight: '700',
    marginBottom: '0.25rem',
    color: 'var(--text-secondary)',
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginTop: '0.2rem',
  },
  tooltipDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
}

function buildChartData(entries) {
  // Get all distinct dates, sorted ascending, capped to last MAX_DAYS
  const allDates = [...new Set(entries.map(e => e.date))].sort()
  const visibleDates = new Set(allDates.slice(-MAX_DAYS))
  const capped = allDates.length > MAX_DAYS

  const filtered = entries.filter(e => visibleDates.has(e.date))

  const byDate = {}
  const titles = {}

  filtered.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = {}
    byDate[e.date][`rank${e.rank}`] = e.score
    titles[`rank${e.rank}`] = e.title
  })

  const data = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => ({
      date: date.slice(5), // MM-DD
      ...scores,
    }))

  return { data, titles, capped, dayCount: allDates.length }
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltip} role="status" aria-live="polite">
      <p style={styles.tooltipLabel}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} style={styles.tooltipRow}>
          <span style={{ ...styles.tooltipDot, background: entry.color }} aria-hidden="true" />
          <span>{entry.name}: <strong>{entry.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div style={styles.container}>
        <p style={styles.empty}>No historical data yet — check back after a few fetches.</p>
      </div>
    )
  }

  const { data, titles, capped, dayCount } = buildChartData(entries)
  const ranks = ['rank1', 'rank2', 'rank3', 'rank4', 'rank5']

  const subtitle = capped
    ? `Past ${MAX_DAYS} days (${dayCount} days total)`
    : dayCount === 1
      ? 'Today — more days will fill this in'
      : `Past ${dayCount} day${dayCount > 1 ? 's' : ''}`

  return (
    <div style={styles.container}>
      <p style={styles.subtitle} aria-label={subtitle}>{subtitle}</p>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'Score',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 10, fill: 'var(--text-muted)' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => {
              const title = titles[value]
              return title
                ? <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {title.length > 24 ? title.slice(0, 24) + '…' : title}
                  </span>
                : value
            }}
          />
          {ranks.map((rank, i) => (
            <Line
              key={rank}
              type="monotone"
              dataKey={rank}
              stroke={CHART_COLORS[i]}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS[i], strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              connectNulls
              name={rank}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
