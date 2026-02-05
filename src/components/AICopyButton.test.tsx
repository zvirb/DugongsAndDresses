import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AICopyButton from './AICopyButton'

describe('AICopyButton', () => {
  const logs = [
    { id: '1', content: 'Goblin attacks Grom', timestamp: new Date('2026-02-05T10:00:00') },
    { id: '2', content: 'Grom counterattacks', timestamp: new Date('2026-02-05T10:01:00') },
  ]
  const characters = [
    { id: '1', name: 'Grom', hp: 20, maxHp: 25, type: 'PLAYER', conditions: '[]' },
    { id: '2', name: 'Goblin', hp: 5, maxHp: 10, type: 'NPC', conditions: '[]' },
  ]
  const turnOrder = [
    { name: 'Grom', init: 10, current: true },
    { name: 'Goblin', init: 5, current: false },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })
  })

  it('renders the copy button', () => {
    render(<AICopyButton logs={logs} characters={characters} turnOrder={turnOrder} />)
    expect(screen.getByText('Copy AI Context')).toBeInTheDocument()
  })

  it('copies the correctly formatted context to clipboard', async () => {
    render(<AICopyButton logs={logs} characters={characters} turnOrder={turnOrder} />)
    
    fireEvent.click(screen.getByText('Copy AI Context'))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    const copiedText = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]
    
    expect(copiedText).toContain('== INITIATIVE ORDER ==')
    expect(copiedText).toContain('-> Grom (Init: 10)')
    expect(copiedText).toContain('   Goblin (Init: 5)')
    
    expect(copiedText).toContain('== CHARACTERS ==')
    expect(copiedText).toContain('- Grom (PLAYER): 20/25 HP [Healthy]')
    expect(copiedText).toContain('- Goblin (NPC): 5/10 HP [Healthy]')
    
    expect(copiedText).toContain('== RECENT LOGS ==')
    expect(copiedText).toContain('Goblin attacks Grom')
    expect(copiedText).toContain('Grom counterattacks')
  })

  it('shows success message after clicking', async () => {
    render(<AICopyButton logs={logs} characters={characters} turnOrder={turnOrder} />)
    
    fireEvent.click(screen.getByText('Copy AI Context'))

    await waitFor(() => {
      expect(screen.getByText('Copied Context!')).toBeInTheDocument()
    })
  })
})
