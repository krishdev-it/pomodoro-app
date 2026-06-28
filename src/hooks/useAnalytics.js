import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { todayISO, weekRange } from '../utils/time'

export function useAnalytics(period = 'week', anchor = null) {
  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const date = anchor || todayISO()
    setLoading(true)
    const { from, to } = weekRange()

    Promise.all([
      api.get(`/api/analytics/summary?period=${period}&date=${date}`),
      api.get(`/api/analytics/daily?from=${from}&to=${to}`),
    ])
      .then(([s, d]) => {
        setSummary(s)
        setDaily(d.days)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period, anchor])

  return { summary, daily, loading }
}
