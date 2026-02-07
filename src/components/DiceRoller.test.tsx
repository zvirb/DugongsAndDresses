import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import DiceRoller from './DiceRoller'
import * as actions from '@/app/actions'

// Mock the server action
vi.mock('@/app/actions', () => ({
  logAction: vi.fn(),
}))

describe('DiceRoller', () => {
  const campaignId = 'test-campaign-id'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders all dice buttons', () => {
    render(<DiceRoller campaignId={campaignId} />)
    expect(screen.getByText('d4')).toBeInTheDocument()
    expect(screen.getByText('d6')).toBeInTheDocument()
    expect(screen.getByText('d8')).toBeInTheDocument()
    expect(screen.getByText('d10')).toBeInTheDocument()
    expect(screen.getByText('d12')).toBeInTheDocument()
    expect(screen.getByText('d20')).toBeInTheDocument()
  })

  it('calls logAction when a dice is clicked', async () => {
    render(<DiceRoller campaignId={campaignId} />)
    const d20Button = screen.getByText('d20')
    fireEvent.click(d20Button)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(actions.logAction).toHaveBeenCalled()

    const callArguments = vi.mocked(actions.logAction).mock.calls[0]
    expect(callArguments[0]).toBe(campaignId)
    expect(callArguments[1]).toContain('**DM** rolls 1d20')
    expect(callArguments[2]).toBe('Roll')
  })

  it('switches modes correctly', () => {
    render(<DiceRoller campaignId={campaignId} />)
    
    const advButton = screen.getByText('Adv')
    fireEvent.click(advButton)
  })

  it('logs with Advantage when Adv mode is selected', async () => {
    render(<DiceRoller campaignId={campaignId} />)
    
    fireEvent.click(screen.getByText('Adv'))
    fireEvent.click(screen.getByText('d20'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(actions.logAction).toHaveBeenCalledWith(
      campaignId,
      expect.stringContaining('**DM** rolls 1d20 with advantage'),
      'Roll'
    )
  })

  it('logs with Disadvantage when Dis mode is selected', async () => {
    render(<DiceRoller campaignId={campaignId} />)
    
    fireEvent.click(screen.getByText('Dis'))
    fireEvent.click(screen.getByText('d20'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(actions.logAction).toHaveBeenCalledWith(
      campaignId,
      expect.stringContaining('**DM** rolls 1d20 with disadvantage'),
      'Roll'
    )
  })

  it('uses custom rollerName when provided', async () => {
      render(<DiceRoller campaignId={campaignId} rollerName="Grom" />)

      fireEvent.click(screen.getByText('d20'))

      await act(async () => {
          await vi.advanceTimersByTimeAsync(600)
      })

      expect(actions.logAction).toHaveBeenCalledWith(
          campaignId,
          expect.stringContaining('**Grom** rolls 1d20'),
          'Roll'
      )
  })

  it('shows rolling state', async () => {
      render(<DiceRoller campaignId={campaignId} />)
      const d20Button = screen.getByText('d20')
      fireEvent.click(d20Button)

      expect(screen.getByText('Rolling...')).toBeInTheDocument()
      expect(d20Button).toBeDisabled()

      await act(async () => {
          await vi.advanceTimersByTimeAsync(600)
      })

      expect(screen.getByText('d20')).toBeInTheDocument()
      expect(screen.queryByText('Rolling...')).not.toBeInTheDocument()
  })
})
