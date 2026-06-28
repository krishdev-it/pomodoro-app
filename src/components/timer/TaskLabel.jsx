import { useState, useRef } from 'react'

export function TaskLabel({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)

  const commit = () => setEditing(false)

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit() }}
        placeholder="What are you working on?"
        style={{
          background: 'var(--clr-bg-2)',
          border: '1px solid var(--clr-accent)',
          borderRadius: 'var(--r-md)',
          fontSize: 15,
          fontWeight: 500,
          color: 'var(--clr-text-primary)',
          padding: '10px 14px',
          width: '100%',
          outline: 'none',
        }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      style={{
        background: 'var(--clr-bg-2)',
        border: '1px solid var(--clr-border)',
        borderRadius: 'var(--r-md)',
        cursor: 'text',
        fontSize: 15,
        fontWeight: 500,
        color: value ? 'var(--clr-text-primary)' : 'var(--clr-text-muted)',
        padding: '10px 14px',
        width: '100%',
        textAlign: 'left',
        transition: 'border-color var(--t-fast), background var(--t-fast)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clr-border-strong)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--clr-border)' }}
    >
      {value || 'What are you working on?'}
    </button>
  )
}
