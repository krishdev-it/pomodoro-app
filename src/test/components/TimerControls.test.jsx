import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimerControls } from '../../components/timer/TimerControls'

const noop = () => {}

function renderControls(isRunning, overrides = {}) {
  return render(
    <TimerControls
      isRunning={isRunning}
      onStart={overrides.onStart ?? noop}
      onPause={overrides.onPause ?? noop}
      onResume={overrides.onResume}
      onSkip={overrides.onSkip ?? noop}
      onReset={overrides.onReset ?? noop}
    />
  )
}

describe('TimerControls', () => {
  it('renders three buttons (reset, play/pause, skip)', () => {
    renderControls(false)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('reset button has title Reset', () => {
    renderControls(false)
    expect(screen.getByTitle('Reset')).toBeInTheDocument()
  })

  it('skip button has title Skip', () => {
    renderControls(false)
    expect(screen.getByTitle('Skip')).toBeInTheDocument()
  })

  it('clicking reset calls onReset', async () => {
    const onReset = vi.fn()
    renderControls(false, { onReset })
    await userEvent.click(screen.getByTitle('Reset'))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('clicking skip calls onSkip', async () => {
    const onSkip = vi.fn()
    renderControls(false, { onSkip })
    await userEvent.click(screen.getByTitle('Skip'))
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('clicking play button when not running calls onStart', async () => {
    const onStart = vi.fn()
    renderControls(false, { onStart })
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[1]) // middle button
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('clicking pause button when running calls onPause', async () => {
    const onPause = vi.fn()
    renderControls(true, { onPause })
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[1])
    expect(onPause).toHaveBeenCalledOnce()
  })
})
