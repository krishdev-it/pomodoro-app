import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Toast } from './components/common/Toast'
import { useToast } from './hooks/useToast'
import { useSettings } from './hooks/useSettings'
import { useAudio } from './hooks/useAudio'
import { useTimer } from './hooks/useTimer'
import { TimerPage } from './pages/TimerPage'
import { HistoryPage } from './pages/HistoryPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { MediaPage } from './pages/MediaPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const { toasts, addToast, removeToast } = useToast()
  const { settings, loading, updateSetting, updateSettings } = useSettings()
  const { playAmbient, stopAmbient, setAmbientVolume, playEndSound } = useAudio()
  const timer = useTimer({ settings, playEndSound })

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/timer" replace />} />
          <Route path="/timer" element={<TimerPage addToast={addToast} timer={timer} />} />
          <Route path="/history" element={<HistoryPage addToast={addToast} />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/media" element={<MediaPage addToast={addToast} playAmbient={playAmbient} stopAmbient={stopAmbient} setAmbientVolume={setAmbientVolume} />} />
          <Route path="/settings" element={<SettingsPage addToast={addToast} settings={settings} loading={loading} updateSetting={updateSetting} updateSettings={updateSettings} />} />
        </Routes>
      </main>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
