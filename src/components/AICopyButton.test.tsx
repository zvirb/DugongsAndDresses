import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AICopyButton from './AICopyButton'
import { Character, LogEntry } from '@/types'

describe('AICopyButton', () => {
  // Simulate logs ordered by timestamp DESC (Newest First)
  const logs = [
    { id: '3', content: 'Secret Note', timestamp: new Date('2026-02-05T10:02:00'), type: 'DM_NOTE' },
    { id: '2', content: 'Grom counterattacks', timestamp: new Date('2026-02-05T10:01:00'), type: 'Combat' },
    { id: '1', content: 'Goblin attacks Grom', timestamp: new Date('2026-02-05T10:00:00'), type: 'Combat' },
  ] as unknown as LogEntry[]

  const characters = [
    {
        id: '1', name: 'Grom', hp: 20, maxHp: 25, type: 'PLAYER', conditions: '[]',
        armorClass: 14, level: 3, class: 'Barbarian', race: 'Orc',
        attributes: JSON.stringify({ str: 18, dex: 12 }),
        speed: 30,
        inventory: JSON.stringify(['Greataxe', 'Potion']),
        activeTurn: true,
        initiativeRoll: 15
    },
    {
        id: '2', name: 'Goblin', hp: 5, maxHp: 10, type: 'NPC', conditions: '[]',
        armorClass: 12, level: 1, class: 'Rogue', race: 'Goblin',
        attributes: '{}',
        inventory: '[]',
        activeTurn: false,
        initiativeRoll: 8
        // speed missing/undefined to test fallback
    },
  ] as unknown as Character[]
  const turnOrder = [
    { name: 'Grom', init: 15, current: true },
    { name: 'Goblin', init: 8, current: false },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(copiedText).toContain('== INSTRUCTIONS ==')

    // Instructions Content
    expect(copiedText).toContain("Role: Dungeon Master's Narrator")
    expect(copiedText).toContain('Truth: Strict adherence to logs. Do NOT invent rolls, outcomes, or dialogue not in logs.')

    // Initiative
    expect(copiedText).toContain('▶ ACTIVE: Grom (Init: 15)')
    expect(copiedText).toContain('  Goblin (Init: 8)')
    
    // Characters
    // Check Grom: ▶ [ACTIVE] Grom [PLAYER] (Orc Barbarian Lvl 3) | HP:20/25 AC:14 Spd:30 Init:15 PP:10 | Cond:Healthy | STR:18 DEX:12 ...
    // Note: Default attributes are added by parseAttributes
    expect(copiedText).toContain('▶ [ACTIVE] Grom [PLAYER] (Orc Barbarian Lvl 3) | HP:20/25 AC:14 Spd:30 Init:15 PP:10 | Cond:Healthy | STR:18 DEX:12 CON:10 INT:10 WIS:10 CHA:10 | Inv:[Greataxe, Potion]')
    
    // Check Goblin: Goblin [NPC] (Goblin Rogue Lvl 1) | HP:5/10 AC:12 Init:8 PP:10 | Cond:Healthy
    expect(copiedText).toContain('Goblin [NPC] (Goblin Rogue Lvl 1) | HP:5/10 AC:12 Init:8 PP:10 | Cond:Healthy | STR:10 DEX:10 CON:10 INT:10 WIS:10 CHA:10')

    // Logs
    // Should NOT contain 'Secret Note'
    expect(copiedText).not.toContain('Secret Note')

    // Should contain public logs in chronological order
    const index1 = copiedText.indexOf('Goblin attacks Grom')
    const index2 = copiedText.indexOf('Grom counterattacks')
    expect(index1).toBeLessThan(index2)
    expect(index1).not.toBe(-1)
  })

  it('shows success message after clicking', async () => {
    render(<AICopyButton logs={logs} characters={characters} turnOrder={turnOrder} />)
    
    fireEvent.click(screen.getByText('Copy AI Context'))

    await waitFor(() => {
      expect(screen.getByText('Copied Context!')).toBeInTheDocument()
    })
  })

  it('handles uppercase attributes correctly for Passive Perception', async () => {
    const uppercaseChar = {
        id: '1', name: 'Grom', hp: 20, maxHp: 25, type: 'PLAYER', conditions: '[]',
        armorClass: 14, level: 3, class: 'Barbarian', race: 'Orc',
        attributes: JSON.stringify({ STR: 18, DEX: 12, CON: 10, INT: 10, WIS: 18, CHA: 10 }), // Uppercase WIS 18 -> PP 14
        speed: 30,
        inventory: '[]',
        activeTurn: true,
        initiativeRoll: 15
    } as unknown as Character
    const oneCharLogs: LogEntry[] = []
    const oneCharTurn: any[] = [{ name: 'Grom', init: 15, current: true }]

    render(<AICopyButton logs={oneCharLogs} characters={[uppercaseChar]} turnOrder={oneCharTurn} />)

    fireEvent.click(screen.getByText('Copy AI Context'))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    const copiedText = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]
    expect(copiedText).toContain('PP:14')
  })
})
