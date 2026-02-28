import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

// Keyword-based auto-categorisation
function categorise(title) {
  const t = title.toLowerCase()
  if (/agreement|policy|war|dept|ban|ruling|law|government|federal|address/.test(t))
    return 'Announcement'
  if (/update|release|launch|now|new|v\d|version|sync|headless|client/.test(t))
    return 'Product Update'
  if (/happiest|happy|personal|my |i've|i've|life|story|journey|ive/.test(t))
    return 'Personal'
  return 'Technical'
}

// Peach family + teal + magenta — all accessible when used as fills with dark legend labels
const PIE_COLORS = {
  'Announcement':   '#AD1457', // magenta
  'Product Update': '#00695C', // teal
  'Personal':       '#E65100', // burnt orange
  'Technical':      '#5C6BC0', // indigo
}

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

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div style={styles.tooltip} role="status" aria-live="polite">
      <p style={{ fontWeight: 700 }}>{name}</p>
      <p>{value} post{value !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function FormatPieChart({ posts }) {
  if (!posts || posts.length === 0) {
    return (
      <div style={styles.container}>
        <p style={styles.empty}>No format data yet.</p>
      </div>
    )
  }

  // Tally categories
  const counts = {}
  posts.forEach(p => {
    const cat = categorise(p.title)
    counts[cat] = (counts[cat] || 0) + 1
  })

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))

  return (
    <div style={styles.container}>
      <p style={styles.subtitle}>Post format distribution</p>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            outerRadius={72}
            dataKey="value"
            label={({ name, percent }) =>
              `${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={PIE_COLORS[entry.name] || '#90A4AE'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
