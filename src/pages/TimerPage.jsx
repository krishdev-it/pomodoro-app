import { CircularTimer } from '../components/timer/CircularTimer'
import { ModeSelector } from '../components/timer/ModeSelector'
import { TaskLabel } from '../components/timer/TaskLabel'
import { TimerControls } from '../components/timer/TimerControls'

const LONG_BREAK_INTERVAL_DEFAULT = 4

const MODE_DESCRIPTIONS = {
  focus: 'Stay focused and eliminate distractions.',
  short_break: 'Take a short breather before the next session.',
  long_break: 'Rest well — you\'ve earned a longer break.',
}

export function TimerPage({ addToast, timer }) {
  const {
    mode, setMode,
    secondsLeft, totalSecs,
    isRunning,
    sessionCount,
    taskLabel, setTaskLabel,
    start, pause, resume, skip, reset,
    settings,
  } = timer

  if (!settings) {
    return (
      <div className="timer-page">
        <span className="text-muted">Loading…</span>
      </div>
    )
  }

  const interval = settings.long_break_interval ?? LONG_BREAK_INTERVAL_DEFAULT
  const focusInCycle = sessionCount % interval

  return (
    <div className="timer-page">
      <div className="timer-desktop-grid">

        {/* Left: timer + controls */}
        <div className="timer-left-col">
          <CircularTimer
            secondsLeft={secondsLeft}
            totalSecs={totalSecs}
            mode={mode}
            isRunning={isRunning}
          />
          <TimerControls
            isRunning={isRunning}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onSkip={skip}
            onReset={reset}
          />
        </div>

        {/* Right: info panel */}
        <div className="timer-right-col">

          <div className="timer-info-section">
            <p className="timer-section-label">Mode</p>
            <ModeSelector mode={mode} onChange={setMode} />
            <p style={{ fontSize: 13, color: 'var(--clr-text-muted)', marginTop: 10 }}>
              {MODE_DESCRIPTIONS[mode]}
            </p>
          </div>

          <div className="timer-info-section">
            <p className="timer-section-label">Current task</p>
            <TaskLabel value={taskLabel} onChange={setTaskLabel} />
          </div>

          <div className="timer-info-section">
            <p className="timer-section-label">Session cycle</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
              {Array.from({ length: interval }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: i < focusInCycle ? 'var(--clr-accent)' : 'var(--clr-bg-4)',
                    boxShadow: i < focusInCycle ? '0 0 8px var(--clr-accent)' : 'none',
                    transition: 'background 0.3s, box-shadow 0.3s',
                  }}
                />
              ))}
              <span style={{ fontSize: 13, color: 'var(--clr-text-muted)', marginLeft: 6 }}>
                {focusInCycle} / {interval}
              </span>
            </div>
          </div>

          <div className="timer-stats-row">
            <div className="timer-stat-box">
              <span className="timer-stat-label">Today</span>
              <span className="timer-stat-value">{sessionCount}</span>
              <span className="timer-stat-sub">sessions</span>
            </div>
            <div className="timer-stat-divider" />
            <div className="timer-stat-box">
              <span className="timer-stat-label">Interval</span>
              <span className="timer-stat-value">{interval}</span>
              <span className="timer-stat-sub">per cycle</span>
            </div>
            <div className="timer-stat-divider" />
            <div className="timer-stat-box">
              <span className="timer-stat-label">Focus time</span>
              <span className="timer-stat-value">{settings.focus_duration ?? 25}</span>
              <span className="timer-stat-sub">minutes</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
