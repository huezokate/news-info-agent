const SOURCE_META = {
  wired:         { label: 'Wired',           dot: '#b91c1c', accent: '#b91c1c', tint: '#fef2f2' },
  techcrunch:    { label: 'TechCrunch',      dot: '#15803d', accent: '#15803d', tint: '#f0fdf4' },
  thehackernews: { label: 'The Hacker News', dot: '#c81e1e', accent: '#c81e1e', tint: '#fde8e8' },
}

const SLOT_LABEL = {
  newest: 'Most Recent',
  middle: 'Mid-day',
  oldest: 'Earliest',
}

const RANK_COLORS = [
  { bg: 'var(--teal)',    text: '#fff' },
  { bg: 'var(--magenta)', text: '#fff' },
  { bg: '#6366f1',        text: '#fff' },
]

const SPREAD_SOURCES = ['wired', 'techcrunch', 'thehackernews']

const s = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    alignItems: 'start',
  },
  gridMobile: {
    gridTemplateColumns: '1fr',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  colHeader: {
    fontSize: '0.78rem',
    fontWeight: '700',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid var(--border)',
    marginBottom: '0.1rem',
  },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  card: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.85rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    transition: 'box-shadow 0.15s, border-color 0.15s',
    cursor: 'pointer',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
  },
  rankBadge: {
    width: 22, height: 22, minWidth: 22,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '0.72rem',
    flexShrink: 0, marginTop: 1,
  },
  slotLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    marginBottom: '-0.1rem',
  },
  title: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: '1.35',
    textDecoration: 'none',
  },
  desc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.45',
    margin: 0,
  },
  readLink: {
    fontSize: '0.73rem',
    fontWeight: '600',
    color: 'var(--teal)',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
    marginTop: '0.1rem',
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontStyle: 'italic',
    padding: '0.5rem 0',
  },
}

function ArticleCard({ post, rank, accent }) {
  const badge = RANK_COLORS[(rank - 1) % RANK_COLORS.length]
  const slot  = post.slot ? SLOT_LABEL[post.slot] : null

  return (
    <article
      style={s.card}
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = accent }}
      onMouseOut={e  => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      <div style={s.cardTop}>
        <div style={{ ...s.rankBadge, background: badge.bg, color: badge.text }} aria-label={`Rank ${rank}`}>
          {rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {slot && <p style={s.slotLabel}>{slot}</p>}
          <a href={post.url} target="_blank" rel="noopener noreferrer" style={s.title}>
            {post.title}
          </a>
        </div>
      </div>

      {post.description && (
        <p style={s.desc}>{post.description}</p>
      )}

      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        style={s.readLink}
        onMouseOver={e => e.currentTarget.style.color = 'var(--teal-hover)'}
        onMouseOut={e  => e.currentTarget.style.color = 'var(--teal)'}
      >
        Read post →
      </a>
    </article>
  )
}

function SourceColumn({ source, posts }) {
  const meta = SOURCE_META[source]
  return (
    <div style={s.col}>
      <p style={{ ...s.colHeader, color: meta.accent }}>
        <span style={{ ...s.dot, background: meta.dot }} />
        {meta.label}
      </p>
      {posts.length > 0
        ? posts.map((post, i) => (
            <ArticleCard key={post.hn_id} post={post} rank={i + 1} accent={meta.accent} />
          ))
        : <p style={s.empty}>No articles fetched yet.</p>
      }
    </div>
  )
}

export default function SpreadGrid({ posts, isMobile }) {
  if (!posts || posts.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        No spread articles yet. Hit "Fetch Now" to load them.
      </p>
    )
  }

  return (
    <div style={{ ...s.grid, ...(isMobile ? s.gridMobile : {}) }}>
      {SPREAD_SOURCES.map(source => (
        <SourceColumn
          key={source}
          source={source}
          posts={posts.filter(p => p.source === source)}
        />
      ))}
    </div>
  )
}
