import { useState, useEffect, useCallback, useMemo } from 'react'

// Fires synchronously on mount, then on every resize — no flash
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}
import { useCopilotReadable } from '@copilotkit/react-core'
import DigestList from './DigestList'
import TrendChart from './TrendChart'
import ScoreBarChart from './ScoreBarChart'
import CommentsBarChart from './CommentsBarChart'
import FormatPieChart from './FormatPieChart'
import CopilotChat from './CopilotChat'
import axios from 'axios'

// Normalise the API URL — ensure it always has a protocol so Axios
// doesn't treat it as a relative path and prepend the frontend origin.
const _rawApi = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API = /^https?:\/\//i.test(_rawApi) ? _rawApi : `https://${_rawApi}`

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: '#fff',
    borderBottom: '2px solid var(--peach)',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  logoMark: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--magenta), var(--teal))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '1rem',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  logoAccent: {
    color: 'var(--magenta)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  dateBadge: {
    background: 'var(--peach)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    fontWeight: '600',
    padding: '0.25rem 0.75rem',
    borderRadius: 'var(--radius-lg)',
  },
  fetchBtn: {
    background: 'var(--magenta)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '0.4rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  // ── Desktop grid (applied inline, overridden by mobile merge below) ──
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gridTemplateRows: '2fr 1fr',
    gridTemplateAreas: '"digest charts" "chat chat"',
    gap: '1.25rem',
    padding: '1.25rem 2rem',
    maxWidth: '1600px',
    margin: '0 auto',
    width: '100%',
    height: 'calc(100vh - 64px)',
    boxSizing: 'border-box',
  },
  mainMobile: {
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'auto auto auto',
    gridTemplateAreas: '"digest" "charts" "chat"',
    height: 'auto',
    padding: '1rem',
    gap: '1.25rem',
    overflowY: 'auto',
  },
  digestArea: {
    gridArea: 'digest',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  digestAreaMobile: {
    overflow: 'visible',
  },
  chartsArea: {
    gridArea: 'charts',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chartsAreaMobile: {
    overflow: 'visible',
  },
  chatArea: {
    gridArea: 'chat',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  chatAreaMobile: {
    overflow: 'visible',
    minHeight: '420px',
  },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  sectionDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--teal)',
    flexShrink: 0,
  },
  // 2×2 chart grid — desktop fills right column, mobile stacks
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: '0.75rem',
    flex: 1,
    overflow: 'hidden',
  },
  chartGridMobile: {
    gridTemplateRows: 'auto auto',
    flex: 'none',
    overflow: 'visible',
  },
  chartLabel: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    marginBottom: '0.3rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    flexShrink: 0,
  },
  chartDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  error: {
    background: 'var(--magenta-tint)',
    border: '1px solid var(--magenta)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.25rem',
    color: 'var(--magenta)',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  loading: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    padding: '2rem 0',
    textAlign: 'center',
  },
}

export default function Dashboard() {
  const isMobile = useIsMobile(768)

  const [today, setToday]       = useState([])
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [fetching, setFetching] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [todayRes, histRes] = await Promise.all([
        axios.get(`${API}/digest/today`),
        axios.get(`${API}/digest/history`),
      ])
      setToday(todayRes.data.posts)
      setHistory(histRes.data.entries)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not reach the backend. Is it running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Stringify to primitive so useCopilotReadable's internal useEffect
  // only fires when the actual data changes, not on every array reference update.
  const todayJson   = useMemo(() => JSON.stringify(today),   [today])
  const historyJson = useMemo(() => JSON.stringify(history), [history])

  useCopilotReadable({
    description: "Today's top 5 Hacker News posts (JSON)",
    value: todayJson,
  })
  useCopilotReadable({
    description: 'All historical Hacker News digest entries for trend analysis (JSON)',
    value: historyJson,
  })

  const handleFetch = async () => {
    setFetching(true)
    try {
      await axios.post(`${API}/digest/fetch`)
      await loadData()
    } catch (err) {
      setError('Manual fetch failed. Check the backend.')
    } finally {
      setFetching(false)
    }
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  return (
    <div style={styles.wrapper}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoMark} aria-hidden="true">HN</div>
          <span style={styles.logoText}>
            Daily <span style={styles.logoAccent}>Trends</span>
          </span>
        </div>

        <div style={styles.headerRight}>
          <span style={styles.dateBadge} aria-label={`Today is ${todayLabel}`}>
            {todayLabel}
          </span>
          <button
            style={styles.fetchBtn}
            onClick={handleFetch}
            disabled={fetching}
            aria-busy={fetching}
            onMouseOver={e => e.currentTarget.style.background = 'var(--magenta-hover)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--magenta)'}
          >
            {fetching ? 'Fetching…' : 'Fetch Now'}
          </button>
        </div>
      </header>

      {/* ── Main grid: responsive via isMobile merge ── */}
      <main
        style={{ ...styles.main, ...(isMobile ? styles.mainMobile : {}) }}
        id="main-content"
      >

        {/* ── Digest: left 1/3 desktop / top on mobile ── */}
        <section
          style={{ ...styles.digestArea, ...(isMobile ? styles.digestAreaMobile : {}) }}
          aria-labelledby="digest-heading"
        >
          <h2 style={styles.sectionTitle} id="digest-heading">
            <span style={styles.sectionDot} aria-hidden="true" />
            Today's Top 5
          </h2>

          {error && (
            <div role="alert" style={{ marginBottom: '0.75rem' }}>
              <p style={styles.error}>{error}</p>
            </div>
          )}

          {loading
            ? <p style={styles.loading} role="status">Loading digest…</p>
            : (
              <div style={isMobile ? {} : { overflowY: 'auto', flex: 1 }}>
                <DigestList posts={today} />
              </div>
            )
          }
        </section>

        {/* ── Charts: right 2/3 desktop / middle on mobile ── */}
        <section
          style={{ ...styles.chartsArea, ...(isMobile ? styles.chartsAreaMobile : {}) }}
          aria-labelledby="charts-heading"
        >
          <h2 style={styles.sectionTitle} id="charts-heading">
            <span style={{ ...styles.sectionDot, background: 'var(--magenta)' }} aria-hidden="true" />
            Trends Over Time
          </h2>

          {loading
            ? <p style={styles.loading} role="status">Loading charts…</p>
            : (
              <div style={{ ...styles.chartGrid, ...(isMobile ? styles.chartGridMobile : {}) }}>

                {/* 1 — Score trend line */}
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <p style={styles.chartLabel}>
                    <span style={{ ...styles.chartDot, background: 'var(--magenta)' }} aria-hidden="true" />
                    Score over days
                  </p>
                  <div style={isMobile ? {} : { flex: 1, minHeight: 0 }}>
                    <TrendChart entries={history} />
                  </div>
                </div>

                {/* 2 — Post format pie */}
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <p style={styles.chartLabel}>
                    <span style={{ ...styles.chartDot, background: 'var(--teal)' }} aria-hidden="true" />
                    Format distribution
                  </p>
                  <div style={isMobile ? {} : { flex: 1, minHeight: 0 }}>
                    <FormatPieChart posts={today} />
                  </div>
                </div>

                {/* 3 — Score bar */}
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <p style={styles.chartLabel}>
                    <span style={{ ...styles.chartDot, background: 'var(--teal)' }} aria-hidden="true" />
                    Score by post
                  </p>
                  <div style={isMobile ? {} : { flex: 1, minHeight: 0 }}>
                    <ScoreBarChart posts={today} />
                  </div>
                </div>

                {/* 4 — Comments bar */}
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <p style={styles.chartLabel}>
                    <span style={{ ...styles.chartDot, background: 'var(--magenta)' }} aria-hidden="true" />
                    Comments by post
                  </p>
                  <div style={isMobile ? {} : { flex: 1, minHeight: 0 }}>
                    <CommentsBarChart posts={today} />
                  </div>
                </div>

              </div>
            )
          }
        </section>

        {/* ── Bottom full-width: Trends Assistant chat ── */}
        <aside style={{ ...styles.chatArea, ...(isMobile ? styles.chatAreaMobile : {}) }} aria-label="AI chat assistant">
          <CopilotChat />
        </aside>

      </main>
    </div>
  )
}
