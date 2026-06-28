import { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useAudioFiles } from '../hooks/useAudioFiles'
import { Toggle } from '../components/common/Toggle'
import { api } from '../api/client'
import { formatBytes } from '../utils/time'

function DurationInput({ value, onChange, label, description, min = 60, max = 7200, step = 60 }) {
  const minutes = Math.round((value ?? 1500) / 60)
  return (
    <div className="setting-row">
      <div className="setting-label">
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={minutes}
          min={min / 60}
          max={max / 60}
          step={step / 60}
          onChange={e => onChange(parseInt(e.target.value, 10) * 60)}
          style={{ width: 72, textAlign: 'center' }}
        />
        <span className="text-muted">min</span>
      </div>
    </div>
  )
}

function VolumeRow({ value, onChange, label }) {
  return (
    <div className="setting-row">
      <div className="setting-label">
        <strong>{label}</strong>
      </div>
      <div className="range-row" style={{ width: 200 }}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value ?? 0.8}
          onChange={e => onChange(parseFloat(e.target.value))}
        />
        <span className="range-value">{Math.round((value ?? 0.8) * 100)}%</span>
      </div>
    </div>
  )
}

function BackupStatus({ addToast }) {
  const [status, setStatus] = useState(null)
  const [triggering, setTriggering] = useState(false)

  const load = () => {
    api.get('/api/backup/status').then(setStatus).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const trigger = async () => {
    setTriggering(true)
    try {
      await api.post('/api/backup/trigger')
      addToast('Backup created', 'success')
      load()
    } catch {
      addToast('Backup failed', 'error')
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div className="card mt-6">
      <div className="card-title">Backup & Data</div>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Last Backup</strong>
          <span>
            {status?.last_backup
              ? `${new Date(status.last_backup.created_at).toLocaleString()} · ${formatBytes(status.last_backup.size_bytes)}`
              : 'No backups yet'}
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={trigger} disabled={triggering}>
          {triggering ? 'Backing up…' : 'Back up now'}
        </button>
      </div>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Stored Backups</strong>
          <span>Keeps last 24 hourly backups automatically</span>
        </div>
        <span className="text-muted monospace">{status?.backup_count ?? 0}</span>
      </div>
    </div>
  )
}

export function SettingsPage({ addToast }) {
  const { settings, loading, updateSetting } = useSettings()
  const files = useAudioFiles()

  if (loading || !settings) {
    return <div className="page"><p className="text-muted">Loading…</p></div>
  }

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>

      {/* Timer */}
      <div className="card mb-6">
        <div className="card-title">Timer Durations</div>
        <DurationInput
          label="Focus"
          description="Length of each work session"
          value={settings.focus_duration}
          onChange={v => updateSetting('focus_duration', v)}
        />
        <DurationInput
          label="Short Break"
          description="Break after each session"
          value={settings.short_break_duration}
          onChange={v => updateSetting('short_break_duration', v)}
          min={60} max={1800}
        />
        <DurationInput
          label="Long Break"
          description="Break after every N sessions"
          value={settings.long_break_duration}
          onChange={v => updateSetting('long_break_duration', v)}
          min={300} max={3600}
        />
        <div className="setting-row">
          <div className="setting-label">
            <strong>Long Break After</strong>
            <span>Number of focus sessions before a long break</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={settings.long_break_interval}
              min={1} max={10}
              onChange={e => updateSetting('long_break_interval', parseInt(e.target.value, 10))}
              style={{ width: 72, textAlign: 'center' }}
            />
            <span className="text-muted">sessions</span>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <strong>Auto-start Breaks</strong>
          </div>
          <Toggle
            checked={settings.auto_start_breaks}
            onChange={v => updateSetting('auto_start_breaks', v)}
          />
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <strong>Auto-start Focus</strong>
          </div>
          <Toggle
            checked={settings.auto_start_focus}
            onChange={v => updateSetting('auto_start_focus', v)}
          />
        </div>
      </div>

      {/* Sound */}
      <div className="card mb-6">
        <div className="card-title">Sound</div>
        <div className="setting-row">
          <div className="setting-label">
            <strong>Session End Sound</strong>
            <span>Plays when a session completes</span>
          </div>
          <select
            value={settings.notification_sound}
            onChange={e => updateSetting('notification_sound', e.target.value)}
            style={{ width: 200 }}
          >
            <option value="default">Default Beep</option>
            {files.map(f => (
              <option key={f.name} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>
        <VolumeRow
          label="End Sound Volume"
          value={settings.end_sound_volume}
          onChange={v => updateSetting('end_sound_volume', v)}
        />
      </div>

      {/* Notifications */}
      <div className="card mb-6">
        <div className="card-title">Notifications</div>
        <div className="setting-row">
          <div className="setting-label">
            <strong>Browser Notifications</strong>
            <span>Show a notification when a session ends</span>
          </div>
          <Toggle
            checked={settings.notification_enabled}
            onChange={v => updateSetting('notification_enabled', v)}
          />
        </div>
      </div>

      <BackupStatus addToast={addToast} />
    </div>
  )
}
