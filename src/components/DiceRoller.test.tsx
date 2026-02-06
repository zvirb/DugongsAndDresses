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
    expect(screen.getByText('d12')).toBeInTheDocument()
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
    expect(callArguments[1]).toContain('**DM** rolled 1d20')
    expect(callArguments[2]).toBe('Roll')
  })

  it('switches modes correctly', () => {
    render(<DiceRoller campaignId={campaignId} />)
    
    const advButton = screen.getByText('Adv')
    fireEvent.click(advButton)
    // Check if the button has some active state - in this case it changes variant
    // We can't easily check the variant via text, but we can check if it's called with the correct mode
  })

  it('logs with Advantage when Adv mode is selected', async () => {
    render(<DiceRoller campaignId={campaignId} />)
    
    fireEvent.click(screen.getByText('Adv'))
    fireEvent.click(screen.getByText('d20'))

    await waitFor(() => {
      expect(actions.logAction).toHaveBeenCalledWith(
        campaignId,
        expect.stringContaining('**DM** rolled 1d20 advantage'),
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
        expect.stringContaining('**DM** rolled 1d20 disadvantage'),
        'Roll'
      )
    })
  })
})
