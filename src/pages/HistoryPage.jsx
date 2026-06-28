import { useState } from 'react'
import { useSessions } from '../hooks/useSessions'
import { formatDate, formatTime, formatDuration, todayISO, monthRange } from '../utils/time'

function ModeBadge({ mode }) {
  const cls = mode === 'focus' ? 'focus' : mode === 'short_break' ? 'short' : 'long'
  const label = mode === 'focus' ? 'Focus' : mode === 'short_break' ? 'Short' : 'Long'
  return <span className={`mode-badge ${cls}`}>{label}</span>
}

export function HistoryPage({ addToast }) {
  const today = todayISO()
  const { from: mFrom, to: mTo } = monthRange()
  const [from, setFrom] = useState(mFrom)
  const [to, setTo] = useState(mTo)
  const [modeFilter, setModeFilter] = useState('')

  const { sessions, total, loading } = useSessions({ from, to, mode: modeFilter || undefined })

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ limit: 9999, offset: 0 })
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch('/api/sessions/export/csv')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sessions.csv'
      a.click()
      URL.revokeObjectURL(url)
      addToast('CSV exported', 'success')
    } catch {
      addToast('Export failed', 'error')
    }
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title" style={{ marginBottom: 0 }}>History</h1>
        <button className="btn btn-ghost btn-sm" onClick={handleExport}>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>From</label>
            <input type="text" value={from} onChange={e => setFrom(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>To</label>
            <input type="text" value={to} onChange={e => setTo(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Mode</label>
            <select value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
              <option value="">All</option>
              <option value="focus">Focus</option>
              <option value="short_break">Short Break</option>
              <option value="long_break">Long Break</option>
            </select>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFrom(mFrom); setTo(mTo); setModeFilter('') }}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 24, color: 'var(--clr-text-muted)', fontSize: 13 }}>Loading…</p>
        ) : sessions.length === 0 ? (
          <p style={{ padding: 24, color: 'var(--clr-text-muted)', fontSize: 13 }}>No sessions found for this period.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Mode</th>
                <th>Task</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--clr-text-primary)' }}>{formatDate(s.started_at)}</td>
                  <td className="monospace">{formatTime(s.started_at)}</td>
                  <td><ModeBadge mode={s.mode} /></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.task_label || <span style={{ color: 'var(--clr-text-muted)' }}>—</span>}
                  </td>
                  <td className="monospace">{formatDuration(s.actual_secs)}</td>
                  <td>
                    <span style={{ color: s.completed ? 'var(--clr-success)' : 'var(--clr-text-muted)', fontSize: 12 }}>
                      {s.completed ? '✓ Done' : '⚡ Interrupted'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && (
        <p className="text-muted mt-4">{total} session{total !== 1 ? 's' : ''} total</p>
      )}
    </div>
  )
}
