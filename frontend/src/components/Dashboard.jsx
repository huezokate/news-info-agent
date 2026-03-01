import { useState, useEffect, useCallback, useMemo } from 'react'

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
import SpreadGrid from './SpreadGrid'
import TrendChart from './TrendChart'
import ScoreBarChart from './ScoreBarChart'
import CommentsBarChart from './CommentsBarChart'
import FormatPieChart from './FormatPieChart'
import CopilotChat from './CopilotChat'
import axios from 'axios'

const _rawApi = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API = /^https?:\/\//i.test(_rawApi) ? _rawApi : `https://${_rawApi}`

const SPREAD_SOURCES = ['wired', 'techcrunch', 'thehackernews']

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },

  header: {
    background: '#fff',
    borderBottom: '2px solid var(--peach)',
    padding: '0 2rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: '64px', position: 'sticky', top: 0, zIndex: 10,
  },
  logo:     { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  logoMark: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--magenta), var(--teal))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '700', fontSize: '1rem', flexShrink: 0,
  },
  logoText:   { fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  logoAccent: { color: 'var(--magenta)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  dateBadge: {
    background: 'var(--peach)', color: 'var(--text-primary)',
    fontSize: '0.8rem', fontWeight: '600', padding: '0.25rem 0.75rem',
    borderRadius: 'var(--radius-lg)',
  },
  fetchBtn: {
    background: 'var(--magenta)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', padding: '0.4rem 1rem',
    fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s',
  },

  // ── Main page grid ──────────────────────────────────────────────────────────
  // Desktop: HN Top 5 (1fr left) | Today's Spread (2fr right)
  //          Charts full-width below, Chat full-width at bottom
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gridTemplateRows: 'auto auto auto',
    gridTemplateAreas: '"hn spread" "charts charts" "chat chat"',
    gap: '1.25rem',
    padding: '1.25rem 2rem',
    maxWidth: '1600px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  mainMobile: {
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'auto',
    gridTemplateAreas: '"hn" "spread" "charts" "chat"',
    padding: '1rem',
  },

  hnArea:      { gridArea: 'hn',      display: 'flex', flexDirection: 'column' },
  spreadArea:  { gridArea: 'spread',  display: 'flex', flexDirection: 'column' },
  chartsArea:  { gridArea: 'charts',  display: 'flex', flexDirection: 'column' },
  chatArea:    { gridArea: 'chat',    display: 'flex', flexDirection: 'column', minHeight: '420px' },

  sectionTitle: {
    fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)',
    marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0,
  },
  sectionDot:  { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 },

  // 2×2 chart grid
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  chartGridMobile: { gridTemplateColumns: '1fr' },
  chartLabel: {
    fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)',
    marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
  },
  chartDot:   { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  chartBox:   { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem' },

  error: {
    background: 'var(--magenta-tint)', border: '1px solid var(--magenta)',
    borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
    color: 'var(--magenta)', fontWeight: '500', fontSize: '0.9rem',
  },
  loading: { color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem 0', textAlign: 'center' },
}

export default function Dashboard() {
  const isMobile = useIsMobile(768)

  const [today,    setToday]    = useState([])
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [fetching, setFetching] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
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

  const todayJson   = useMemo(() => JSON.stringify(today),   [today])
  const historyJson = useMemo(() => JSON.stringify(history), [history])
  useCopilotReadable({ description: "Today's top Hacker News posts (JSON)",        value: todayJson   })
  useCopilotReadable({ description: 'All historical digest entries for charting (JSON)', value: historyJson })

  const handleFetch = async () => {
    setFetching(true)
    try {
      await axios.post(`${API}/digest/fetch`)
      await loadData()
    } catch {
      setError('Manual fetch failed. Check the backend.')
    } finally {
      setFetching(false)
    }
  }

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  // Split posts by section
  const hnPosts     = today.filter(p => p.source === 'hackernews' || !p.source)
  const spreadPosts = today.filter(p => SPREAD_SOURCES.includes(p.source))

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
          <span style={styles.dateBadge}>{todayLabel}</span>
          <button
            style={styles.fetchBtn}
            onClick={handleFetch}
            disabled={fetching}
            onMouseOver={e => e.currentTarget.style.background = 'var(--magenta-hover)'}
            onMouseOut={e  => e.currentTarget.style.background = 'var(--magenta)'}
          >
            {fetching ? 'Fetching…' : 'Fetch Now'}
          </button>
        </div>
      </header>

      {/* ── Main grid ── */}
      <main style={{ ...styles.main, ...(isMobile ? styles.mainMobile : {}) }} id="main-content">

        {/* ── LEFT: HN Top 5 ── */}
        <section style={styles.hnArea} aria-labelledby="hn-heading">
          <h2 style={styles.sectionTitle} id="hn-heading">
            <span style={{ ...styles.sectionDot, background: '#f97316' }} aria-hidden="true" />
            Today's Top 5
          </h2>
          {error && <p style={{ ...styles.error, marginBottom: '0.75rem' }} role="alert">{error}</p>}
          {loading
            ? <p style={styles.loading} role="status">Loading…</p>
            : <DigestList posts={hnPosts} />
          }
        </section>

        {/* ── RIGHT: Today's Spread (3-column grid) ── */}
        <section style={styles.spreadArea} aria-labelledby="spread-heading">
          <h2 style={styles.sectionTitle} id="spread-heading">
            <span style={styles.sectionDot} aria-hidden="true" />
            Today's Digest
          </h2>
          {loading
            ? <p style={styles.loading} role="status">Loading…</p>
            : <SpreadGrid posts={spreadPosts} isMobile={isMobile} />
          }
        </section>

        {/* ── BELOW: Charts (full width, 2×2 grid) ── */}
        <section style={styles.chartsArea} aria-labelledby="charts-heading">
          <h2 style={styles.sectionTitle} id="charts-heading">
            <span style={{ ...styles.sectionDot, background: 'var(--magenta)' }} aria-hidden="true" />
            Trends Over Time
          </h2>
          {loading
            ? <p style={styles.loading}>Loading charts…</p>
            : (
              <div style={{ ...styles.chartGrid, ...(isMobile ? styles.chartGridMobile : {}) }}>
                <div style={styles.chartBox}>
                  <p style={styles.chartLabel}><span style={{ ...styles.chartDot, background: 'var(--magenta)' }} />Score over days</p>
                  <TrendChart entries={history} />
                </div>
                <div style={styles.chartBox}>
                  <p style={styles.chartLabel}><span style={{ ...styles.chartDot, background: 'var(--teal)' }} />Format distribution</p>
                  <FormatPieChart posts={hnPosts} />
                </div>
                <div style={styles.chartBox}>
                  <p style={styles.chartLabel}><span style={{ ...styles.chartDot, background: 'var(--teal)' }} />Score by post</p>
                  <ScoreBarChart posts={hnPosts} />
                </div>
                <div style={styles.chartBox}>
                  <p style={styles.chartLabel}><span style={{ ...styles.chartDot, background: 'var(--magenta)' }} />Comments by post</p>
                  <CommentsBarChart posts={hnPosts} />
                </div>
              </div>
            )
          }
        </section>

        {/* ── BOTTOM: Trends Assistant ── */}
        <aside style={styles.chatArea} aria-label="AI chat assistant">
          <CopilotChat />
        </aside>

      </main>
    </div>
  )
}
