import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskLabel } from '../../components/timer/TaskLabel'

describe('TaskLabel', () => {
  it('shows placeholder text when value is empty', () => {
    render(<TaskLabel value="" onChange={() => {}} />)
    expect(screen.getByText('What are you working on?')).toBeInTheDocument()
  })

  it('shows the current value when set', () => {
    render(<TaskLabel value="Build a rocket" onChange={() => {}} />)
    expect(screen.getByText('Build a rocket')).toBeInTheDocument()
  })

  it('shows no input field initially', () => {
    render(<TaskLabel value="Task" onChange={() => {}} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('clicking the label reveals an input', async () => {
    render(<TaskLabel value="Task" onChange={() => {}} />)
    await userEvent.click(screen.getByText('Task'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('typing in the input calls onChange', async () => {
    const onChange = vi.fn()
    render(<TaskLabel value="" onChange={onChange} />)
    await userEvent.click(screen.getByText('What are you working on?'))
    await userEvent.type(screen.getByRole('textbox'), 'A')
    expect(onChange).toHaveBeenCalled()
  })

  it('pressing Enter commits and hides the input', async () => {
    render(<TaskLabel value="Task" onChange={() => {}} />)
    await userEvent.click(screen.getByText('Task'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('blurring the input hides it', async () => {
    render(<TaskLabel value="Task" onChange={() => {}} />)
    await userEvent.click(screen.getByText('Task'))
    await userEvent.tab()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
