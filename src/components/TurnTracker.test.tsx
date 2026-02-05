import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TurnTracker from './TurnTracker'
import * as actions from '@/app/actions'

// Mock the server actions
vi.mock('@/app/actions', () => ({
  setNextTurn: vi.fn(),
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
    const gromSection = screen.getByText('Grom').closest('div')
    // We can't easily check for classes without knowing exactly how cn() results look in jsdom,
    // but we can check if the text "Taking Turn..." is near Grom.
    expect(screen.getByText('Grom').nextSibling?.textContent).toBe('Taking Turn...')
  })

  it('calls setNextTurn when Next Turn is clicked', async () => {
    render(<TurnTracker initialParticipants={participants} campaignId={campaignId} />)
    
    const nextTurnButton = screen.getByText('Next Turn')
    fireEvent.click(nextTurnButton)

    // Current active is Grom (index 1 in sorted list [Elara, Grom, Goblin]).
    // Next should be Goblin (index 2).
    await waitFor(() => {
      expect(actions.setNextTurn).toHaveBeenCalledWith(campaignId, '3')
    })
  })

  it('loops back to the first participant when the last one finishes their turn', async () => {
    const lastActiveParticipants = [
        { id: '1', name: 'Grom', initiativeRoll: 10, type: 'PLAYER', activeTurn: false },
        { id: '2', name: 'Elara', initiativeRoll: 15, type: 'PLAYER', activeTurn: false },
        { id: '3', name: 'Goblin', initiativeRoll: 5, type: 'NPC', activeTurn: true },
    ]
    render(<TurnTracker initialParticipants={lastActiveParticipants} campaignId={campaignId} />)
    
    fireEvent.click(screen.getByText('Next Turn'))

    // Current active is Goblin (index 2 in sorted list [Elara, Grom, Goblin]).
    // Next should be Elara (index 0).
    await waitFor(() => {
      expect(actions.setNextTurn).toHaveBeenCalledWith(campaignId, '2')
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
