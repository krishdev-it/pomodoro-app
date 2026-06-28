import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAnalytics } from '../hooks/useAnalytics'
import { formatDuration, todayISO, weekRange, monthRange } from '../utils/time'

function StatsCards({ summary }) {
  if (!summary) return null
  const cards = [
    { label: 'Focus Time', value: formatDuration(summary.total_focus_secs), sub: 'this period' },
    { label: 'Completed', value: summary.completed_sessions, sub: 'pomodoros' },
    { label: 'Streak', value: `${summary.current_streak_days}d`, sub: `best ${summary.longest_streak_days}d` },
    { label: 'Interruptions', value: summary.total_interruptions, sub: 'total pauses' },
    {
      label: 'Best Day',
      value: summary.best_day ? formatDuration(summary.best_day.secs) : '—',
      sub: summary.best_day ? summary.best_day.d : 'no data',
    },
    { label: 'Daily Avg', value: formatDuration(summary.avg_daily_focus_secs), sub: 'focus time' },
  ]
  return (
    <div className="stats-grid">
      {cards.map(c => (
        <div className="stat-card" key={c.label}>
          <div className="stat-label">{c.label}</div>
          <div className="stat-value">{c.value}</div>
          <div className="stat-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--clr-bg-3)', border: '1px solid var(--clr-border)',
      borderRadius: 'var(--r-md)', padding: '8px 12px', fontSize: 13,
    }}>
      <div style={{ color: 'var(--clr-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--clr-text-primary)', fontFamily: 'var(--font-mono)' }}>
        {formatDuration(payload[0].value)}
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState('week')
  const { summary, daily, loading } = useAnalytics(period)

  const chartData = daily.map(d => ({
    name: d.d.slice(5),
    focus_secs: d.focus_secs,
  }))

  return (
    <div className="page">
      <h1 className="page-title">Analytics</h1>

      <div className="period-tabs">
        {['day', 'week', 'month', 'year'].map(p => (
          <button
            key={p}
            className={`period-tab${period === p ? ' active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <StatsCards summary={summary} />

          {chartData.length > 0 && (
            <div className="card">
              <div className="card-title">Daily Focus Time</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={20}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => formatDuration(v)}
                    tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--clr-bg-3)' }} />
                  <Bar dataKey="focus_secs" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="var(--clr-accent)" fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p className="text-muted">No data for this period. Complete some sessions first.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
