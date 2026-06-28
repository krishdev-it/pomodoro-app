import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CircularTimer } from '../../components/timer/CircularTimer'

function renderTimer(overrides = {}) {
  return render(
    <CircularTimer
      secondsLeft={overrides.secondsLeft ?? 1500}
      totalSecs={overrides.totalSecs ?? 1500}
      mode={overrides.mode ?? 'focus'}
      isRunning={overrides.isRunning ?? false}
    />
  )
}

describe('CircularTimer', () => {
  it('renders without crashing', () => {
    renderTimer()
  })

  it('displays 25:00 when secondsLeft is 1500', () => {
    renderTimer({ secondsLeft: 1500 })
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('displays 00:00 when secondsLeft is 0', () => {
    renderTimer({ secondsLeft: 0 })
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  it('displays 05:00 for a short break default', () => {
    renderTimer({ secondsLeft: 300, totalSecs: 300, mode: 'short_break' })
    expect(screen.getByText('05:00')).toBeInTheDocument()
  })

  it('shows Focus label for focus mode', () => {
    renderTimer({ mode: 'focus' })
    expect(screen.getByText('Focus')).toBeInTheDocument()
  })

  it('shows Short Break label for short_break mode', () => {
    renderTimer({ mode: 'short_break' })
    expect(screen.getByText('Short Break')).toBeInTheDocument()
  })

  it('shows Long Break label for long_break mode', () => {
    renderTimer({ mode: 'long_break' })
    expect(screen.getByText('Long Break')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    const { container } = renderTimer()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('progress circle has stroke-dashoffset attribute', () => {
    const { container } = renderTimer()
    const circles = container.querySelectorAll('circle')
    const progressCircle = circles[1]
    expect(progressCircle).toHaveAttribute('stroke-dashoffset')
  })
})
