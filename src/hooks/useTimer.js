import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api/client'
import { formatMMSS } from '../utils/time'

const MODE_COLORS = {
  focus: ['#e05c4b', 'rgba(224,92,75,0.12)'],
  short_break: ['#4bcde0', 'rgba(75,205,224,0.12)'],
  long_break: ['#7b68ee', 'rgba(123,104,238,0.12)'],
}

const MODE_TITLES = {
  focus: 'Time to focus!',
  short_break: 'Short break!',
  long_break: 'Long break!',
}

function setAccent(mode) {
  const [color, dim] = MODE_COLORS[mode]
  document.documentElement.style.setProperty('--clr-accent', color)
  document.documentElement.style.setProperty('--clr-accent-dim', dim)
}

export function useTimer({ settings, playEndSound }) {
  const [mode, setModeState] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [interruptions, setInterruptions] = useState(0)
  const [taskLabel, setTaskLabel] = useState('')
  const startedAt = useRef(null)
  const intervalRef = useRef(null)
  const modeRef = useRef('focus')
  const sessionCountRef = useRef(0)
  const isRunningRef = useRef(false)
  const sessionTotalRef = useRef(null)   // pinned total for the active session
  const isPausedRef = useRef(false)

  const totalSecs = settings
    ? (mode === 'focus'
        ? settings.focus_duration
        : mode === 'short_break'
        ? settings.short_break_duration
        : settings.long_break_duration)
    : 1500

  // Sync secondsLeft when mode or settings change while idle (not paused)
  useEffect(() => {
    if (!isRunning && !isPausedRef.current) {
      setSecondsLeft(totalSecs)
    }
  }, [mode, totalSecs, isRunning])

  // Update accent color on mode change
  useEffect(() => {
    setAccent(mode)
    modeRef.current = mode
  }, [mode])

  // Sync document title with timer state
  useEffect(() => {
    if (isRunning || isPausedRef.current) {
      document.title = `${formatMMSS(secondsLeft ?? totalSecs)} - ${MODE_TITLES[mode]}`
    } else {
      document.title = 'Pomodoro'
    }
  }, [secondsLeft, mode, isRunning])

  useEffect(() => () => { document.title = 'Pomodoro' }, [])

  const nextMode = useCallback(() => {
    if (modeRef.current !== 'focus') {
      return 'focus'
    }
    const next = sessionCountRef.current + 1
    const interval = settings?.long_break_interval ?? 4
    return next % interval === 0 ? 'long_break' : 'short_break'
  }, [settings])

  const onSessionEnd = useCallback(async () => {
    clearInterval(intervalRef.current)
    isRunningRef.current = false
    isPausedRef.current = false
    sessionTotalRef.current = null
    setIsRunning(false)

    const endedAt = new Date().toISOString()
    const actualSecs = totalSecs

    // Save session
    try {
      await api.post('/api/sessions', {
        mode: modeRef.current,
        task_label: taskLabel,
        planned_secs: totalSecs,
        actual_secs: actualSecs,
        completed: true,
        interruptions,
        started_at: startedAt.current || endedAt,
        ended_at: endedAt,
      })
    } catch (e) {
      console.error('Failed to save session', e)
    }

    // Play end sound
    if (settings?.notification_sound && settings.notification_sound !== 'default') {
      playEndSound(`/api/audio/stream/${settings.notification_sound}`, settings.end_sound_volume)
    } else {
      playEndSound(null, settings?.end_sound_volume ?? 0.8)
    }

    // Browser notification
    if (settings?.notification_enabled && Notification.permission === 'granted') {
      new Notification(
        modeRef.current === 'focus' ? 'Focus session complete!' : 'Break time over!',
        { body: taskLabel || 'Time to switch.', icon: '/favicon.svg' }
      )
    }

    // Advance state
    if (modeRef.current === 'focus') {
      const newCount = sessionCountRef.current + 1
      setSessionCount(newCount)
      sessionCountRef.current = newCount
    }

    const nm = nextMode()
    setModeState(nm)
    setInterruptions(0)
    setSecondsLeft(
      nm === 'focus'
        ? settings?.focus_duration ?? 1500
        : nm === 'short_break'
        ? settings?.short_break_duration ?? 300
        : settings?.long_break_duration ?? 900
    )
    startedAt.current = null
  }, [taskLabel, interruptions, totalSecs, settings, playEndSound, nextMode])

  const start = useCallback(() => {
    if (!startedAt.current) {
      startedAt.current = new Date().toISOString()
    }
    if (Notification.permission === 'default' && settings?.notification_enabled) {
      Notification.requestPermission().catch(() => {})
    }
    sessionTotalRef.current = totalSecs
    isRunningRef.current = true
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          onSessionEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [onSessionEnd, settings])

  const pause = useCallback(() => {
    clearInterval(intervalRef.current)
    isRunningRef.current = false
    isPausedRef.current = true
    setIsRunning(false)
    setInterruptions(prev => prev + 1)
  }, [])

  const resume = useCallback(() => {
    if (!startedAt.current) {
      startedAt.current = new Date().toISOString()
    }
    if (!sessionTotalRef.current) {
      sessionTotalRef.current = totalSecs
    }
    if (Notification.permission === 'default' && settings?.notification_enabled) {
      Notification.requestPermission().catch(() => {})
    }
    isPausedRef.current = false
    isRunningRef.current = true
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          onSessionEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [onSessionEnd, settings, totalSecs])

  const skip = useCallback(async () => {
    clearInterval(intervalRef.current)
    isRunningRef.current = false
    isPausedRef.current = false
    sessionTotalRef.current = null
    setIsRunning(false)

    if (startedAt.current && modeRef.current === 'focus') {
      const elapsed = totalSecs - (secondsLeft ?? 0)
      if (elapsed > 0) {
        try {
          await api.post('/api/sessions', {
            mode: modeRef.current,
            task_label: taskLabel,
            planned_secs: totalSecs,
            actual_secs: elapsed,
            completed: false,
            interruptions,
            started_at: startedAt.current,
            ended_at: new Date().toISOString(),
          })
        } catch {}
      }
    }

    const nm = nextMode()
    setModeState(nm)
    setInterruptions(0)
    startedAt.current = null
  }, [totalSecs, secondsLeft, taskLabel, interruptions, nextMode])

  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    isRunningRef.current = false
    isPausedRef.current = false
    sessionTotalRef.current = null
    setIsRunning(false)
    setSecondsLeft(totalSecs)
    setInterruptions(0)
    startedAt.current = null
  }, [totalSecs])

  const setMode = useCallback((m) => {
    if (isRunningRef.current) {
      // Timer is running — just switch the label, never touch the interval
      setModeState(m)
      return
    }
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setModeState(m)
    setInterruptions(0)
    startedAt.current = null
  }, [])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const effectiveTotalSecs = sessionTotalRef.current ?? totalSecs

  return {
    mode, setMode,
    secondsLeft: secondsLeft ?? totalSecs,
    totalSecs: effectiveTotalSecs,
    isRunning,
    sessionCount,
    interruptions,
    taskLabel, setTaskLabel,
    start, pause, resume, skip, reset,
    settings,
  }
}
