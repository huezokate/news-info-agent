const RANK_COLORS = [
  { bg: 'var(--teal)',         text: '#fff'                },
  { bg: 'var(--magenta)',      text: '#fff'                },
  { bg: 'var(--peach-mid)',    text: 'var(--text-primary)' },
  { bg: 'var(--teal-tint)',    text: 'var(--teal)'         },
  { bg: 'var(--magenta-tint)', text: 'var(--magenta)'      },
]

const s = {
  list:  { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  card: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.9rem 1.1rem',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '0 0.85rem',
    alignItems: 'start',
    transition: 'box-shadow 0.15s, border-color 0.15s',
  },
  rankBadge: {
    width: 28, height: 28,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '0.8rem',
    flexShrink: 0, marginTop: 2,
  },
  body:  { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  title: { fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4', textDecoration: 'none' },
  readLink: {
    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
    fontSize: '0.73rem', fontWeight: '600', color: 'var(--teal)', textDecoration: 'none',
  },
  meta:        { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' },
  chip:        { fontSize: '0.72rem', fontWeight: '600', padding: '0.12rem 0.55rem', borderRadius: 'var(--radius-lg)' },
  scoreChip:   { background: 'var(--teal-tint)',    color: 'var(--teal)'         },
  commentChip: { background: 'var(--peach)',         color: 'var(--text-primary)' },
  byChip:      { background: 'var(--magenta-tint)', color: 'var(--magenta)'      },
  empty:       { color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.5rem 0', textAlign: 'center' },
}

export default function DigestList({ posts }) {
  if (!posts || posts.length === 0) {
    return <p style={s.empty}>No posts yet. Hit "Fetch Now" to load them.</p>
  }

  return (
    <ol style={s.list} aria-label="Top Hacker News posts">
      {posts.map((post, i) => {
        const badge = RANK_COLORS[i % RANK_COLORS.length]
        return (
          <li key={post.hn_id ?? i}>
            <article
              style={s.card}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = 'var(--teal)' }}
              onMouseOut={e  => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{ ...s.rankBadge, background: badge.bg, color: badge.text }} aria-label={`Rank ${i + 1}`}>
                {i + 1}
              </div>
              <div style={s.body}>
                <a href={post.url} target="_blank" rel="noopener noreferrer" style={s.title}>
                  {post.title}
                </a>
                <a
                  href={post.url} target="_blank" rel="noopener noreferrer"
                  style={s.readLink}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--teal-hover)'}
                  onMouseOut={e  => e.currentTarget.style.color = 'var(--teal)'}
                >
                  Read post →
                </a>
                <div style={s.meta}>
                  <span style={{ ...s.chip, ...s.scoreChip }}>▲ {post.score}</span>
                  <span style={{ ...s.chip, ...s.commentChip }}>💬 {post.comments}</span>
                  <span style={{ ...s.chip, ...s.byChip }}>{post.by}</span>
                </div>
              </div>
            </article>
          </li>
        )
      })}
    </ol>
  )
}
