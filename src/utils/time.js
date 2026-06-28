export function formatMMSS(seconds) {
  const m = Math.floor(Math.max(0, seconds) / 60)
  const s = Math.max(0, seconds) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  })
}

export function extractYouTubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function weekRange() {
  const d = new Date()
  const day = d.getDay()
  const start = new Date(d)
  start.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  }
}

export function monthRange(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  }
}
