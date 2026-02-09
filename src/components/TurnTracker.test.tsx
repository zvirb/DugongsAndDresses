import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TurnTracker from './TurnTracker'
import * as actions from '@/app/actions'

// Mock the server actions
vi.mock('@/app/actions', () => ({
  advanceTurn: vi.fn(),
  updateInitiative: vi.fn(),
}))

describe('TurnTracker', () => {
  const campaignId = 'test-campaign'
  const participants = [
    { id: '1', name: 'Grom', initiativeRoll: 10, type: 'PLAYER', activeTurn: true },
    { id: '2', name: 'Elara', initiativeRoll: 15, type: 'PLAYER', activeTurn: false },
    { id: '3', name: 'Goblin', initiativeRoll: 5, type: 'NPC', activeTurn: false },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all participants sorted by initiative', () => {
    render(<TurnTracker initialParticipants={participants} campaignId={campaignId} />)

    const names = screen.getAllByText(/Grom|Elara|Goblin/).map(el => el.textContent)
    // Should be Elara (15), Grom (10), Goblin (5)
    expect(names[0]).toBe('Elara')
    expect(names[1]).toBe('Grom')
    expect(names[2]).toBe('Goblin')
  })

  it('highlights the active participant', () => {
    render(<TurnTracker initialParticipants={participants} campaignId={campaignId} />)
    expect(screen.getByText('Taking Turn...')).toBeInTheDocument()
    // Grom is the one with activeTurn: true in the mock data
    expect(screen.getByText('Grom').nextSibling?.textContent).toBe('Taking Turn...')
  })

  it('calls advanceTurn with current active ID when Next Turn is clicked', async () => {
    render(<TurnTracker initialParticipants={participants} campaignId={campaignId} />)

    const nextTurnButton = screen.getByText('Next')
    fireEvent.click(nextTurnButton)

    // Current active is Grom (id='1').
    await waitFor(() => {
      expect(actions.advanceTurn).toHaveBeenCalledWith(campaignId, '1')
    })
  })

  it('calls advanceTurn with correct current active ID even for last participant', async () => {
    const lastActiveParticipants = [
      { id: '1', name: 'Grom', initiativeRoll: 10, type: 'PLAYER', activeTurn: false },
      { id: '2', name: 'Elara', initiativeRoll: 15, type: 'PLAYER', activeTurn: false },
      { id: '3', name: 'Goblin', initiativeRoll: 5, type: 'NPC', activeTurn: true },
    ]
    render(<TurnTracker initialParticipants={lastActiveParticipants} campaignId={campaignId} />)

    fireEvent.click(screen.getByText('Next'))

    // Current active is Goblin (id='3').
    await waitFor(() => {
      expect(actions.advanceTurn).toHaveBeenCalledWith(campaignId, '3')
    })
  })

  it('calls updateInitiative on blur', async () => {
    render(<TurnTracker initialParticipants={participants} campaignId={campaignId} />)

    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '20' } })
    fireEvent.blur(inputs[0])

    await waitFor(() => {
      // inputs[0] corresponds to the first one in the list (Elara)
      expect(actions.updateInitiative).toHaveBeenCalledWith('2', 20)
    })
  })
})
