import { CopilotChat as CKChat } from '@copilotkit/react-ui'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  header: {
    background: 'var(--peach)',
    padding: '0.85rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    borderBottom: '1px solid var(--peach-mid)',
    flexShrink: 0,
  },
  headerIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--magenta), var(--teal))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  headerText: {
    fontWeight: '700',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  headerSub: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '1px',
  },
}

export default function CopilotChat() {
  return (
    <div style={styles.wrapper} aria-label="AI assistant chat">
      {/* Custom branded header */}
      <div style={styles.header}>
        <div style={styles.headerIcon} aria-hidden="true">✦</div>
        <div>
          <p style={styles.headerText}>Trends Assistant</p>
          <p style={styles.headerSub}>Ask about today's posts or past trends</p>
        </div>
      </div>

      {/* Inline CopilotChat — avoids popup open/close state loop */}
      <CKChat
        instructions={`You are a Hacker News digest assistant. You have access to today's top 5 posts and historical data.
Answer questions like "what was the top post today?", "which post had the highest score this week?",
"summarise this week's trends", or "who posted the most this month?".
Keep answers concise and friendly. When listing posts, include title, score and author.`}
        labels={{
          title: 'Trends Assistant',
          initial: "Hi! Ask me anything about today's HN digest or past trends.",
          placeholder: 'e.g. What was the top post today?',
        }}
      />
    </div>
  )
}
