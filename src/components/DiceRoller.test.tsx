import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  })

  it('renders all dice buttons', () => {
    render(<DiceRoller campaignId={campaignId} />)
    expect(screen.getByText('d4')).toBeInTheDocument()
    expect(screen.getByText('d6')).toBeInTheDocument()
    expect(screen.getByText('d8')).toBeInTheDocument()
    expect(screen.getByText('d10')).toBeInTheDocument()
    expect(screen.getByText('d20')).toBeInTheDocument()
  })

  it('calls logAction when a dice is clicked', async () => {
    render(<DiceRoller campaignId={campaignId} />)
    const d20Button = screen.getByText('d20')
    fireEvent.click(d20Button)

    await waitFor(() => {
      expect(actions.logAction).toHaveBeenCalled()
    })

    const callArguments = vi.mocked(actions.logAction).mock.calls[0]
    expect(callArguments[0]).toBe(campaignId)
    expect(callArguments[1]).toMatch(/\*\*DM\*\* (casts the die \(d20\)\.\.\.|rolls a \*\*CRITICAL (HIT|MISS)\*\*!)/)
    expect(callArguments[2]).toBe('Roll')
  })

  it('uses provided rollerName', async () => {
    const rollerName = "Grom"
    render(<DiceRoller campaignId={campaignId} rollerName={rollerName} />)
    const d20Button = screen.getByText('d20')
    fireEvent.click(d20Button)

    await waitFor(() => {
      expect(actions.logAction).toHaveBeenCalledWith(
        campaignId,
        expect.stringMatching(new RegExp(`\\*\\*${rollerName}\\*\\* (casts the die \\(d20\\)\\.\\.\\.|rolls a \\*\\*CRITICAL (HIT|MISS)\\*\\*!)`)),
        'Roll'
      )
    })
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

    await waitFor(() => {
      expect(actions.logAction).toHaveBeenCalledWith(
        campaignId,
        expect.stringContaining(' (ADVANTAGE)'),
        'Roll'
      )
    })
  })

  it('logs with Disadvantage when Dis mode is selected', async () => {
    render(<DiceRoller campaignId={campaignId} />)

    fireEvent.click(screen.getByText('Dis'))
    fireEvent.click(screen.getByText('d20'))

    await waitFor(() => {
      expect(actions.logAction).toHaveBeenCalledWith(
        campaignId,
        expect.stringContaining(' (DISADVANTAGE)'),
        'Roll'
      )
    })
  })

  it('displays rolling state and disables buttons while rolling', async () => {
    render(<DiceRoller campaignId={campaignId} />)
    const d20Button = screen.getByText('d20')
    fireEvent.click(d20Button)

    // Should show "ROLLING..." immediately in header
    expect(screen.getByText('ROLLING...')).toBeInTheDocument()

    // All buttons should be disabled
    const d4Button = screen.getByText('d4')
    expect(d4Button).toBeDisabled()

    // The rolling button itself should be disabled (text changes to "...")
    expect(screen.getByText('...')).toBeDisabled()

    // Wait for roll to finish
    await waitFor(() => {
      expect(actions.logAction).toHaveBeenCalled()
    })

    // After roll, "ROLLING..." should be gone and buttons enabled
    expect(screen.queryByText('ROLLING...')).not.toBeInTheDocument()
    expect(screen.getByText('d20')).not.toBeDisabled()
  })
})
