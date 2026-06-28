import { describe, it, expect } from 'vitest'
import {
  formatMMSS,
  formatDuration,
  extractYouTubeId,
  formatBytes,
  todayISO,
} from '../../utils/time'

describe('formatMMSS', () => {
  it('formats 0 seconds as 00:00', () => expect(formatMMSS(0)).toBe('00:00'))
  it('formats 90 seconds as 01:30', () => expect(formatMMSS(90)).toBe('01:30'))
  it('formats 1500 seconds as 25:00', () => expect(formatMMSS(1500)).toBe('25:00'))
  it('formats 3599 seconds as 59:59', () => expect(formatMMSS(3599)).toBe('59:59'))
  it('clamps negative values to 00:00', () => expect(formatMMSS(-10)).toBe('00:00'))
})

describe('formatDuration', () => {
  it('shows seconds for values under 60', () => expect(formatDuration(45)).toBe('45s'))
  it('shows minutes only for exact minutes', () => expect(formatDuration(1500)).toBe('25m'))
  it('shows hours only when no leftover minutes', () => expect(formatDuration(3600)).toBe('1h'))
  it('shows hours and minutes', () => expect(formatDuration(3660)).toBe('1h 1m'))
  it('handles 0 seconds', () => expect(formatDuration(0)).toBe('0s'))
})

describe('extractYouTubeId', () => {
  it('extracts id from youtu.be short URL', () =>
    expect(extractYouTubeId('https://youtu.be/abc123DEF_x')).toBe('abc123DEF_x'))

  it('extracts id from full watch URL', () =>
    expect(extractYouTubeId('https://www.youtube.com/watch?v=abc123DEF_x')).toBe('abc123DEF_x'))

  it('extracts id from embed URL', () =>
    expect(extractYouTubeId('https://www.youtube.com/embed/abc123DEF_x')).toBe('abc123DEF_x'))

  it('returns null for non-YouTube URL', () =>
    expect(extractYouTubeId('https://example.com/video')).toBeNull())

  it('returns null for empty string', () =>
    expect(extractYouTubeId('')).toBeNull())
})

describe('formatBytes', () => {
  it('shows bytes for small values', () => expect(formatBytes(512)).toBe('512 B'))
  it('shows KB for kilobyte range', () => expect(formatBytes(2048)).toBe('2 KB'))
  it('shows MB for megabyte range', () => expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB'))
})

describe('todayISO', () => {
  it('returns a string matching YYYY-MM-DD', () =>
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/))
})
