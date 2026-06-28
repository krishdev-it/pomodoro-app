import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '../../api/client'

function mockFetch(status, body) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  })
}

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch(200, {}))
  })

  it('api.get calls fetch with GET method and correct URL', async () => {
    await api.get('/api/settings')
    expect(fetch).toHaveBeenCalledWith(
      '/api/settings',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('api.post calls fetch with POST method and JSON body', async () => {
    vi.stubGlobal('fetch', mockFetch(201, { id: 1 }))
    await api.post('/api/sessions', { mode: 'focus' })
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toBe('/api/sessions')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ mode: 'focus' })
    expect(opts.headers['Content-Type']).toBe('application/json')
  })

  it('api.patch calls fetch with PATCH method', async () => {
    await api.patch('/api/settings', { focus_duration: 1200 })
    expect(fetch).toHaveBeenCalledWith(
      '/api/settings',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('api.put calls fetch with PUT method', async () => {
    await api.put('/api/playlist/reorder', { order: [1, 2] })
    expect(fetch).toHaveBeenCalledWith(
      '/api/playlist/reorder',
      expect.objectContaining({ method: 'PUT' })
    )
  })

  it('api.delete calls fetch with DELETE method', async () => {
    vi.stubGlobal('fetch', mockFetch(204, null))
    await api.delete('/api/sessions/1')
    expect(fetch).toHaveBeenCalledWith(
      '/api/sessions/1',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('returns null for 204 No Content response', async () => {
    vi.stubGlobal('fetch', mockFetch(204, null))
    const result = await api.delete('/api/sessions/1')
    expect(result).toBeNull()
  })

  it('throws on non-ok response with detail message', async () => {
    vi.stubGlobal('fetch', mockFetch(404, { detail: 'Not found' }))
    await expect(api.get('/api/missing')).rejects.toThrow('Not found')
  })

  it('throws with HTTP status text when no detail in error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => { throw new Error('bad json') },
    }))
    await expect(api.get('/api/crash')).rejects.toThrow('Internal Server Error')
  })
})
