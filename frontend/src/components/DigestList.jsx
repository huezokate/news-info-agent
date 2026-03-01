// ── Source metadata ───────────────────────────────────────────────────────────
const SOURCE_META = {
  hackernews:    { label: 'Hacker News',     chip: 'HN',  dot: '#f97316', chipBg: '#fff4e5', chipColor: '#b45309' },
  wired:         { label: 'Wired',           chip: 'W',   dot: '#b91c1c', chipBg: '#fef2f2', chipColor: '#b91c1c' },
  techcrunch:    { label: 'TechCrunch',      chip: 'TC',  dot: '#15803d', chipBg: '#f0fdf4', chipColor: '#15803d' },
  thehackernews: { label: 'The Hacker News', chip: 'THN', dot: '#c81e1e', chipBg: '#fde8e8', chipColor: '#c81e1e' },
}

const SLOT_LABEL = {
  newest: 'Most Recent',
  middle: 'Mid-day',
  oldest: 'Earliest',
}

// ── Rank badge colour cycle ───────────────────────────────────────────────────
const RANK_COLORS = [
  { bg: 'var(--teal)',         text: '#fff'                },
  { bg: 'var(--magenta)',      text: '#fff'                },
  { bg: 'var(--peach-mid)',    text: 'var(--text-primary)' },
  { bg: 'var(--teal-tint)',    text: 'var(--teal)'         },
  { bg: 'var(--magenta-tint)', text: 'var(--magenta)'      },
]

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  sectionLabel: {
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginBottom: '0.5rem',
  },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  list: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  card: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.85rem 1.1rem',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '0 0.85rem',
    alignItems: 'start',
    transition: 'box-shadow 0.15s, border-color 0.15s',
  },
  rankBadge: {
    width: 26, height: 26,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '0.78rem',
    flexShrink: 0, marginTop: 2,
  },
  cardBody: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  slotLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
  },
  title: {
    fontSize: '0.9rem', fontWeight: '600',
    color: 'var(--text-primary)', lineHeight: '1.35', textDecoration: 'none',
  },
  readLink: {
    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
    fontSize: '0.73rem', fontWeight: '600',
    color: 'var(--teal)', textDecoration: 'none',
  },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' },
  chip: {
    fontSize: '0.72rem', fontWeight: '600',
    padding: '0.12rem 0.55rem', borderRadius: 'var(--radius-lg)',
  },
  scoreChip:   { background: 'var(--teal-tint)',    color: 'var(--teal)'         },
  commentChip: { background: 'var(--peach)',         color: 'var(--text-primary)' },
  byChip:      { background: 'var(--magenta-tint)', color: 'var(--magenta)'      },
  empty: { color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.5rem 0', textAlign: 'center' },
  divider: { borderTop: '1px solid var(--border)', margin: '1rem 0 0.85rem' },
  spreadHeader: {
    fontSize: '0.8rem', fontWeight: '700',
    color: 'var(--text-primary)',
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    marginBottom: '0.65rem',
  },
}

// ── Single post card ──────────────────────────────────────────────────────────
function PostCard({ post, displayRank, isHN }) {
  const badge  = RANK_COLORS[(displayRank - 1) % RANK_COLORS.length]
  const src    = SOURCE_META[post.source] || SOURCE_META.hackernews
  const slot   = post.slot ? SLOT_LABEL[post.slot] : null

  return (
    <li>
      <article
        style={s.card}
        onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = 'var(--teal)' }}
        onMouseOut={e  => { e.currentTarget.style.boxShadow = 'none';                         e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        <div style={{ ...s.rankBadge, background: badge.bg, color: badge.text }} aria-label={`Rank ${displayRank}`}>
          {displayRank}
        </div>

        <div style={s.cardBody}>
          {/* Slot label for spread articles */}
          {slot && <span style={s.slotLabel}>{slot}</span>}

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
            {/* Source chip */}
            <span style={{ ...s.chip, background: src.chipBg, color: src.chipColor }}>
              {src.chip}
            </span>

            {/* Score + comments only meaningful for HN */}
            {isHN && (
              <>
                <span style={{ ...s.chip, ...s.scoreChip }}>▲ {post.score}</span>
                <span style={{ ...s.chip, ...s.commentChip }}>💬 {post.comments}</span>
              </>
            )}

            <span style={{ ...s.chip, ...s.byChip }}>{post.by}</span>
          </div>
        </div>
      </article>
    </li>
  )
}

// ── Spread source group ───────────────────────────────────────────────────────
function SpreadSourceGroup({ source, posts }) {
  const meta = SOURCE_META[source] || SOURCE_META.hackernews
  return (
    <div>
      <p style={s.sectionLabel}>
        <span style={{ ...s.dot, background: meta.dot }} />
        {meta.label}
      </p>
      <ol style={s.list} aria-label={`${meta.label} spread`}>
        {posts.map((post, i) => (
          <PostCard key={post.hn_id} post={post} displayRank={i + 1} isHN={false} />
        ))}
      </ol>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const SPREAD_SOURCES = ['wired', 'techcrunch', 'thehackernews']

export default function DigestList({ posts }) {
  if (!posts || posts.length === 0) {
    return <p style={s.empty}>No posts available for today yet. Hit "Fetch Now" to load them.</p>
  }

  const hnPosts     = posts.filter(p => p.source === 'hackernews' || !p.source)
  const spreadPosts = posts.filter(p => SPREAD_SOURCES.includes(p.source))

  return (
    <div>

      {/* ── Hacker News Top 5 ── */}
      {hnPosts.length > 0 && (
        <>
          <p style={s.sectionLabel}>
            <span style={{ ...s.dot, background: '#f97316' }} />
            Hacker News
          </p>
          <ol style={s.list} aria-label="Top Hacker News posts">
            {hnPosts.map((post, i) => (
              <PostCard key={post.hn_id} post={post} displayRank={i + 1} isHN />
            ))}
          </ol>
        </>
      )}

      {/* ── Today's Spread ── */}
      {spreadPosts.length > 0 && (
        <>
          <div style={{ ...s.divider, marginTop: hnPosts.length > 0 ? '1rem' : 0 }} />

          <p style={{ ...s.spreadHeader }}>
            <span style={{ ...s.dot, background: 'var(--teal)', width: 8, height: 8 }} />
            Today's Spread
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {SPREAD_SOURCES.map(source => {
              const group = spreadPosts.filter(p => p.source === source)
              return group.length > 0
                ? <SpreadSourceGroup key={source} source={source} posts={group} />
                : null
            })}
          </div>
        </>
      )}

    </div>
  )
}
