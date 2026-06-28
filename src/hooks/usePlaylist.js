import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function usePlaylist() {
  const [playlist, setPlaylist] = useState([])

  const fetch = () => {
    api.get('/api/playlist').then(d => setPlaylist(d.playlist)).catch(() => {})
  }

  useEffect(() => { fetch() }, [])

  const add = useCallback(async (url, title) => {
    const item = await api.post('/api/playlist', { url, title })
    setPlaylist(prev => [...prev, item])
    return item
  }, [])

  const remove = useCallback(async (id) => {
    await api.delete(`/api/playlist/${id}`)
    setPlaylist(prev => prev.filter(i => i.id !== id))
  }, [])

  const update = useCallback(async (id, data) => {
    const updated = await api.patch(`/api/playlist/${id}`, data)
    setPlaylist(prev => prev.map(i => i.id === id ? updated : i))
  }, [])

  const reorder = useCallback(async (order) => {
    setPlaylist(prev => {
      const map = Object.fromEntries(prev.map(i => [i.id, i]))
      return order.map((id, pos) => ({ ...map[id], position: pos }))
    })
    await api.put('/api/playlist/reorder', { order })
  }, [])

  return { playlist, add, remove, update, reorder }
}
