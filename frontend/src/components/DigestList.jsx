const styles = {
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  card: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.25rem',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '0 1rem',
    alignItems: 'start',
    transition: 'box-shadow 0.15s, border-color 0.15s',
    textDecoration: 'none',
  },
  rankBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.8rem',
    flexShrink: 0,
    marginTop: '2px',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    lineHeight: '1.4',
    textDecoration: 'none',
  },
  readLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--teal)',
    textDecoration: 'none',
    textUnderlineOffset: '2px',
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    alignItems: 'center',
  },
  chip: {
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '0.15rem 0.6rem',
    borderRadius: 'var(--radius-lg)',
  },
  scoreChip: {
    background: 'var(--teal-tint)',
    color: 'var(--teal)',
  },
  commentChip: {
    background: 'var(--peach)',
    color: 'var(--text-primary)',
  },
  byChip: {
    background: 'var(--magenta-tint)',
    color: 'var(--magenta)',
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    padding: '1.5rem 0',
    textAlign: 'center',
  },
}

// Rank badge colours cycle: teal → magenta → peach(dark text)
const rankColors = [
  { bg: 'var(--teal)',    text: '#fff'                },
  { bg: 'var(--magenta)', text: '#fff'               },
  { bg: 'var(--peach-mid)', text: 'var(--text-primary)' },
  { bg: 'var(--teal-tint)', text: 'var(--teal)'      },
  { bg: 'var(--magenta-tint)', text: 'var(--magenta)'},
]

export default function DigestList({ posts }) {
  if (!posts || posts.length === 0) {
    return <p style={styles.empty}>No posts available for today yet. Hit "Fetch Now" to load them.</p>
  }

  return (
    <ol style={styles.list} aria-label="Today's top Hacker News posts">
      {posts.map((post, i) => {
        const badge = rankColors[i] || rankColors[0]
        return (
          <li key={post.hn_id}>
            <article
              style={styles.card}
              onMouseOver={e => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = 'var(--teal)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              {/* Rank */}
              <div
                style={{ ...styles.rankBadge, background: badge.bg, color: badge.text }}
                aria-label={`Rank ${post.rank}`}
              >
                {post.rank}
              </div>

              {/* Body */}
              <div style={styles.cardBody}>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.title}
                  aria-label={`${post.title} (opens in new tab)`}
                >
                  {post.title}
                </a>

                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.readLink}
                  aria-label={`Read post: ${post.title}`}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--teal-hover)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--teal)'}
                >
                  Read post →
                </a>

                <div style={styles.meta} aria-label="Post stats">
                  <span
                    style={{ ...styles.chip, ...styles.scoreChip }}
                    aria-label={`Score: ${post.score}`}
                  >
                    ▲ {post.score}
                  </span>
                  <span
                    style={{ ...styles.chip, ...styles.commentChip }}
                    aria-label={`${post.comments} comments`}
                  >
                    💬 {post.comments}
                  </span>
                  <span
                    style={{ ...styles.chip, ...styles.byChip }}
                    aria-label={`Posted by ${post.by}`}
                  >
                    {post.by}
                  </span>
                </div>
              </div>
            </article>
          </li>
        )
      })}
    </ol>
  )
}
