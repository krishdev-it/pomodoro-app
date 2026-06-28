import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModeSelector } from '../../components/timer/ModeSelector'

describe('ModeSelector', () => {
  it('renders all three mode buttons', () => {
    render(<ModeSelector mode="focus" onChange={() => {}} />)
    expect(screen.getByText('Focus')).toBeInTheDocument()
    expect(screen.getByText('Short Break')).toBeInTheDocument()
    expect(screen.getByText('Long Break')).toBeInTheDocument()
  })

  it('applies active class to the current mode button', () => {
    render(<ModeSelector mode="focus" onChange={() => {}} />)
    expect(screen.getByText('Focus').className).toContain('active')
    expect(screen.getByText('Short Break').className).not.toContain('active')
    expect(screen.getByText('Long Break').className).not.toContain('active')
  })

  it('applies active class to short_break when selected', () => {
    render(<ModeSelector mode="short_break" onChange={() => {}} />)
    expect(screen.getByText('Short Break').className).toContain('active')
    expect(screen.getByText('Focus').className).not.toContain('active')
  })

  it('calls onChange with correct id when a tab is clicked', async () => {
    const onChange = vi.fn()
    render(<ModeSelector mode="focus" onChange={onChange} />)
    await userEvent.click(screen.getByText('Short Break'))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('short_break')
  })

  it('calls onChange with long_break when Long Break clicked', async () => {
    const onChange = vi.fn()
    render(<ModeSelector mode="focus" onChange={onChange} />)
    await userEvent.click(screen.getByText('Long Break'))
    expect(onChange).toHaveBeenCalledWith('long_break')
  })

  it('calls onChange even when clicking the already-active tab', async () => {
    const onChange = vi.fn()
    render(<ModeSelector mode="focus" onChange={onChange} />)
    await userEvent.click(screen.getByText('Focus'))
    expect(onChange).toHaveBeenCalledWith('focus')
  })
})
