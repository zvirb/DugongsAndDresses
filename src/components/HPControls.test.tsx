import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HPControls from './HPControls'
import * as actions from '@/app/actions'

// Mock the server action
vi.mock('@/app/actions', () => ({
  updateHP: vi.fn(),
}))

describe('HPControls', () => {
  const characterId = 'char-123'
  const currentHp = 10

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders buttons', () => {
    render(<HPControls characterId={characterId} currentHp={currentHp} />)
    // Dynamic buttons (default 1)
    expect(screen.getByText('-1')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    // Quick buttons
    expect(screen.getByText('-5')).toBeInTheDocument()
    expect(screen.getByText('+5')).toBeInTheDocument()
  })

  it('calls updateHP with -1 when dynamic -1 button is clicked', async () => {
    render(<HPControls characterId={characterId} currentHp={currentHp} />)
    fireEvent.click(screen.getByText('-1'))

    await waitFor(() => {
      expect(actions.updateHP).toHaveBeenCalledWith(characterId, -1)
    })
  })

  it('calls updateHP with +1 when dynamic +1 button is clicked', async () => {
    render(<HPControls characterId={characterId} currentHp={currentHp} />)
    fireEvent.click(screen.getByText('+1'))

    await waitFor(() => {
      expect(actions.updateHP).toHaveBeenCalledWith(characterId, 1)
    })
  })

  it('updates amount when input changes and uses new amount', async () => {
    render(<HPControls characterId={characterId} currentHp={currentHp} />)
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '3' } })
    
    // Should now have -3 and +3
    expect(screen.getByText('-3')).toBeInTheDocument()
    expect(screen.getByText('+3')).toBeInTheDocument()

    fireEvent.click(screen.getByText('+3'))
    await waitFor(() => {
      expect(actions.updateHP).toHaveBeenCalledWith(characterId, 3)
    })
  })

  it('calls updateHP with -5 when quick -5 button is clicked', async () => {
    render(<HPControls characterId={characterId} currentHp={currentHp} />)
    fireEvent.click(screen.getByText('-5'))

    await waitFor(() => {
      expect(actions.updateHP).toHaveBeenCalledWith(characterId, -5)
    })
  })
})
