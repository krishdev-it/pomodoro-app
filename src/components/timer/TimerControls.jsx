function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function SkipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 4 15 12 5 20 5 4" />
      <rect x="19" y="4" width="2" height="16" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

export function TimerControls({ isRunning, onStart, onPause, onResume, onSkip, onReset }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <button
        className="btn btn-ghost"
        onClick={onReset}
        title="Reset"
        style={{ width: 52, height: 52, borderRadius: '50%', padding: 0 }}
      >
        <ResetIcon />
      </button>

      <button
        className="btn btn-primary"
        onClick={isRunning ? onPause : (onResume || onStart)}
        style={{
          width: 76,
          height: 76,
          fontSize: 16,
          borderRadius: '50%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          flexShrink: 0,
        }}
      >
        {isRunning ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        className="btn btn-ghost"
        onClick={onSkip}
        title="Skip"
        style={{ width: 52, height: 52, borderRadius: '50%', padding: 0 }}
      >
        <SkipIcon />
      </button>
    </div>
  )
}
