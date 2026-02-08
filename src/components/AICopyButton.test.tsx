import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AICopyButton from './AICopyButton'

describe('AICopyButton', () => {
  // Simulate logs ordered by timestamp DESC (Newest First) as per getActiveCampaign
  const logs = [
    { id: '2', content: 'Grom counterattacks', timestamp: new Date('2026-02-05T10:01:00'), type: 'Combat' },
    { id: '1', content: 'Goblin attacks Grom', timestamp: new Date('2026-02-05T10:00:00'), type: 'Combat' },
  ]

  const characters = [
    {
        id: '1', name: 'Grom', hp: 20, maxHp: 25, type: 'PLAYER', conditions: '[]',
        armorClass: 14, level: 3, class: 'Barbarian', race: 'Orc',
        attributes: JSON.stringify({ str: 18, dex: 12 }),
        speed: 30
    },
    {
        id: '2', name: 'Goblin', hp: 5, maxHp: 10, type: 'NPC', conditions: '[]',
        armorClass: 12, level: 1, class: 'Rogue', race: 'Goblin',
        attributes: '{}',
        // speed missing/undefined to test fallback
    },
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
    
    // Headers
    expect(copiedText).toContain('== CURRENT GAME STATE ==')
    expect(copiedText).toContain('== INITIATIVE ==')
    expect(copiedText).toContain('== CHARACTERS ==')
    expect(copiedText).toContain('== RECENT LOGS (Chronological) ==')

    // Initiative
    expect(copiedText).toContain('▶ ACTIVE: Grom (Init: 10)')
    expect(copiedText).toContain('  Goblin (Init: 5)')
    
    // Characters
    // Check Grom (with Attributes and Speed)
    // Note: parseAttributes keys might be uppercase slice(0,3) -> STR, DEX
    expect(copiedText).toContain('- Grom [PLAYER] | HP: 20/25 | AC: 14 | Spd: 30 | Orc Barbarian (Lvl 3) | Status: Healthy | [STR:18 DEX:12]')
    
    // Check Goblin (no Attributes, no Speed)
    expect(copiedText).toContain('- Goblin [NPC] | HP: 5/10 | AC: 12 | Goblin Rogue (Lvl 1) | Status: Healthy') // No trailing | [] if empty

    // Logs (Chronological: Oldest -> Newest)
    // logs[1] (10:00) should appear before logs[0] (10:01)
    const index1 = copiedText.indexOf('Goblin attacks Grom')
    const index2 = copiedText.indexOf('Grom counterattacks')
    expect(index1).toBeLessThan(index2)
  })

  it('shows success message after clicking', async () => {
    render(<AICopyButton logs={logs} characters={characters} turnOrder={turnOrder} />)
    
    fireEvent.click(screen.getByText('Copy AI Context'))

    await waitFor(() => {
      expect(screen.getByText('Copied Context!')).toBeInTheDocument()
    })
  })
})
