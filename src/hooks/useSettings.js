import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/settings')
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateSetting = useCallback(async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    try {
      await api.patch('/api/settings', { [key]: value })
    } catch (e) {
      console.error('Failed to save setting:', e)
    }
  }, [])

  const updateSettings = useCallback(async (updates) => {
    setSettings(prev => ({ ...prev, ...updates }))
    try {
      await api.patch('/api/settings', updates)
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }, [])

  return { settings, loading, updateSetting, updateSettings }
}
