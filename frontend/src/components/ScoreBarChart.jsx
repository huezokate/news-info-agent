import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'

const BAR_COLOR  = '#00695C' // teal — 6.88:1 on white ✓
const BAR_HOVER  = '#004D40'

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
    padding: '0.5rem 0.8rem',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
}

function shorten(title) {
  const words = title.split(' ')
  return words.length <= 3 ? title : words.slice(0, 3).join(' ') + '…'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltip} role="status" aria-live="polite">
      <p style={{ fontWeight: 700, marginBottom: '0.15rem', color: 'var(--text-secondary)' }}>{label}</p>
      <p>Score: <strong style={{ color: BAR_COLOR }}>{payload[0].value}</strong></p>
    </div>
  )
}

export default function ScoreBarChart({ posts }) {
  if (!posts || posts.length === 0) {
    return (
      <div style={styles.container}>
        <p style={styles.empty}>No score data yet.</p>
      </div>
    )
  }

  const data = posts.map(p => ({
    name: shorten(p.title),
    fullTitle: p.title,
    score: p.score,
  }))

  return (
    <div style={styles.container}>
      <p style={styles.subtitle}>Today's scores</p>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 40, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            angle={-25}
            textAnchor="end"
            interval={0}
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--teal-tint)' }} />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
