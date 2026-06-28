import { createPortal } from 'react-dom'

export function Toast({ toasts, removeToast }) {
  return createPortal(
    <div className="toast-portal">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
          {t.message}
        </div>
      ))}
    </div>,
    document.body
  )
}
