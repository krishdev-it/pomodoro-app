const MODES = [
  { id: 'focus', label: 'Focus' },
  { id: 'short_break', label: 'Short Break' },
  { id: 'long_break', label: 'Long Break' },
]

export function ModeSelector({ mode, onChange }) {
  return (
    <div className="period-tabs" style={{ marginBottom: 0 }}>
      {MODES.map(m => (
        <button
          key={m.id}
          className={`period-tab${mode === m.id ? ' active' : ''}`}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
