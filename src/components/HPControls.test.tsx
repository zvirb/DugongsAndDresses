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

  it('renders -1 and +1 buttons', () => {
    render(<HPControls characterId={characterId} currentHp={currentHp} />)
    expect(screen.getByText('-1')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('calls updateHP with -1 when -1 button is clicked', async () => {
    render(<HPControls characterId={characterId} currentHp={currentHp} />)
    fireEvent.click(screen.getByText('-1'))

    await waitFor(() => {
      expect(actions.updateHP).toHaveBeenCalledWith(characterId, -1)
    })
  })

  it('calls updateHP with +1 when +1 button is clicked', async () => {
    render(<HPControls characterId={characterId} currentHp={currentHp} />)
    fireEvent.click(screen.getByText('+1'))

    await waitFor(() => {
      expect(actions.updateHP).toHaveBeenCalledWith(characterId, 1)
    })
  })

  it('disables buttons while update is pending', async () => {
    // We can simulate a slow action
    vi.mocked(actions.updateHP).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<HPControls characterId={characterId} currentHp={currentHp} />)
    
    const minusBtn = screen.getByText('-1')
    fireEvent.click(minusBtn)

    expect(minusBtn).toBeDisabled()
    expect(screen.getByText('+1')).toBeDisabled()

    await waitFor(() => {
      expect(minusBtn).not.toBeDisabled()
    })
  })
})
