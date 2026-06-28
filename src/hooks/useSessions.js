import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function useSessions({ from, to, mode, limit = 100, offset = 0 } = {}) {
  const [sessions, setSessions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(() => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (mode) params.set('mode', mode)
    params.set('limit', limit)
    params.set('offset', offset)

    setLoading(true)
    api.get(`/api/sessions?${params}`)
      .then(d => { setSessions(d.sessions); setTotal(d.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [from, to, mode, limit, offset])

  useEffect(() => { fetch() }, [fetch])

  return { sessions, total, loading, refetch: fetch }
}
