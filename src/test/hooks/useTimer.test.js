import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../../hooks/useTimer'

vi.mock('../../api/client', () => ({
  api: {
    post: vi.fn().mockResolvedValue({ id: 1 }),
    get: vi.fn().mockResolvedValue({}),
  },
}))

const SETTINGS = {
  focus_duration: 1500,
  short_break_duration: 300,
  long_break_duration: 900,
  long_break_interval: 4,
  notification_enabled: false,
  notification_sound: 'default',
  end_sound_volume: 0.8,
}

const playEndSound = vi.fn()

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('initialises with focus mode and correct seconds', () => {
    const { result } = renderHook(() => useTimer({ settings: SETTINGS, playEndSound }))
    expect(result.current.mode).toBe('focus')
    expect(result.current.isRunning).toBe(false)
    expect(result.current.secondsLeft).toBe(1500)
    expect(result.current.totalSecs).toBe(1500)
  })

  it('start() sets isRunning to true', () => {
    const { result } = renderHook(() => useTimer({ settings: SETTINGS, playEndSound }))
    act(() => result.current.start())
    expect(result.current.isRunning).toBe(true)
  })

  it('pause() sets isRunning to false', () => {
    const { result } = renderHook(() => useTimer({ settings: SETTINGS, playEndSound }))
    act(() => result.current.start())
    act(() => result.current.pause())
    expect(result.current.isRunning).toBe(false)
  })

  it('seconds count down each tick', () => {
    const { result } = renderHook(() => useTimer({ settings: SETTINGS, playEndSound }))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.secondsLeft).toBe(1497)
  })

  it('setMode while stopped changes mode and resets seconds', () => {
    const { result } = renderHook(() => useTimer({ settings: SETTINGS, playEndSound }))
    act(() => result.current.setMode('short_break'))
    expect(result.current.mode).toBe('short_break')
    expect(result.current.isRunning).toBe(false)
    expect(result.current.secondsLeft).toBe(300)
  })

  it('setMode while running changes mode label but keeps timer going', () => {
    const { result } = renderHook(() => useTimer({ settings: SETTINGS, playEndSound }))
    act(() => result.current.start())
    act(() => result.current.setMode('short_break'))
    expect(result.current.mode).toBe('short_break')
    expect(result.current.isRunning).toBe(true)
  })

  it('setMode while running does not reset secondsLeft', () => {
    const { result } = renderHook(() => useTimer({ settings: SETTINGS, playEndSound }))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(5000))
    const before = result.current.secondsLeft
    act(() => result.current.setMode('short_break'))
    expect(result.current.secondsLeft).toBe(before)
  })

  it('reset() stops timer and restores secondsLeft', () => {
    const { result } = renderHook(() => useTimer({ settings: SETTINGS, playEndSound }))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(10000))
    act(() => result.current.reset())
    expect(result.current.isRunning).toBe(false)
    expect(result.current.secondsLeft).toBe(1500)
  })

  it('sessionCount starts at 0', () => {
    const { result } = renderHook(() => useTimer({ settings: SETTINGS, playEndSound }))
    expect(result.current.sessionCount).toBe(0)
  })

  it('taskLabel starts empty and can be set', () => {
    const { result } = renderHook(() => useTimer({ settings: SETTINGS, playEndSound }))
    expect(result.current.taskLabel).toBe('')
    act(() => result.current.setTaskLabel('Deep work'))
    expect(result.current.taskLabel).toBe('Deep work')
  })
})
