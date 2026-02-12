import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import DiceRoller from './DiceRoller'
import * as actions from '@/app/actions'

// Mock the server action
vi.mock('@/app/actions', () => ({
  logAction: vi.fn(),
}))

describe('DiceRoller', () => {
  const campaignId = 'test-campaign-id'
  const originalCrypto = window.crypto;

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(actions.logAction).mockResolvedValue({ success: true })

    // Default mock for crypto if not overridden in test
    const mockGetRandomValues = vi.fn().mockImplementation((array) => {
        // Return a random byte to avoid infinite loops in rejection sampling
        array[0] = Math.floor(Math.random() * 255);
        return array;
    });
    Object.defineProperty(window, 'crypto', {
      value: { getRandomValues: mockGetRandomValues },
      writable: true
    });
  })

  afterEach(() => {
      Object.defineProperty(window, 'crypto', {
          value: originalCrypto,
          writable: true
      });
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
    // Updated regex to allow for potential (ADVANTAGE) suffix if defaults changed, but for normal it shouldn't be there.
    expect(callArguments[1]).toMatch(/(A natural 20! \*\*DM\*\* rolls a \*\*CRITICAL HIT\*\*!|Disaster strikes! \*\*DM\*\* rolls a \*\*CRITICAL MISS\*\*!|\*\*DM\*\* rolls d20: \*\*\d+\*\*\.)/)
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
        expect.stringMatching(new RegExp(`(A natural 20! \\*\\*${rollerName}\\*\\* rolls a \\*\\*CRITICAL HIT\\*\\*!|Disaster strikes! \\*\\*${rollerName}\\*\\* rolls a \\*\\*CRITICAL MISS\\*\\*!|\\*\\*${rollerName}\\*\\* rolls d20: \\*\\*\\d+\\*\\*\\.)`)),
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
        expect.stringContaining(' [ADVANTAGE]'),
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
        expect.stringContaining(' [DISADVANTAGE]'),
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

    // The rolling button itself should be disabled (text changes to spinner)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()

    // Wait for roll to finish
    await waitFor(() => {
      expect(actions.logAction).toHaveBeenCalled()
    })

    // After roll, "ROLLING..." should be gone and buttons enabled
    expect(screen.queryByText('ROLLING...')).not.toBeInTheDocument()
    expect(screen.getByText('d20')).not.toBeDisabled()
  })

  it('resets rolling state and re-enables buttons even if logAction fails', async () => {
    render(<DiceRoller campaignId={campaignId} />)

    // Mock logAction to fail once
    vi.mocked(actions.logAction).mockRejectedValueOnce(new Error('Network error'))

    const d20Button = screen.getByText('d20')
    fireEvent.click(d20Button)

    // Should show "ROLLING..." immediately
    expect(screen.getByText('ROLLING...')).toBeInTheDocument()
    expect(d20Button).toBeDisabled()

    // Wait for the async action to complete (and fail)
    await waitFor(() => {
      expect(screen.queryByText('ROLLING...')).not.toBeInTheDocument()
    })

    // Buttons should be enabled again
    expect(d20Button).not.toBeDisabled()
  })

  it('logs showing the math (both rolls) when in Advantage', async () => {
    render(<DiceRoller campaignId={campaignId} />)

    fireEvent.click(screen.getByText('Adv'))
    fireEvent.click(screen.getByText('d20'))

    await waitFor(() => {
      expect(actions.logAction).toHaveBeenCalledWith(
        campaignId,
        expect.stringMatching(/\[ADVANTAGE\] \(Rolls: \*\*\d+\*\*, \*\*\d+\*\*\)/),
        'Roll'
      )
    })
  })

  it('logs showing the math (both rolls) when in Disadvantage', async () => {
    render(<DiceRoller campaignId={campaignId} />)

    fireEvent.click(screen.getByText('Dis'))
    fireEvent.click(screen.getByText('d20'))

    await waitFor(() => {
      expect(actions.logAction).toHaveBeenCalledWith(
        campaignId,
        expect.stringMatching(/\[DISADVANTAGE\] \(Rolls: \*\*\d+\*\*, \*\*\d+\*\*\)/),
        'Roll'
      )
    })
  })

  it('logs CRITICAL HIT format correctly', async () => {
    // Force a 20 (d20). 19 % 20 + 1 = 20.
    const mockGetRandomValues = vi.fn().mockImplementation((array) => {
      array[0] = 19;
      return array;
    });
    Object.defineProperty(window, 'crypto', {
      value: { getRandomValues: mockGetRandomValues },
      writable: true
    });

    render(<DiceRoller campaignId={campaignId} />)
    const d20Button = screen.getByText('d20')
    fireEvent.click(d20Button)

    await waitFor(() => {
        expect(actions.logAction).toHaveBeenCalledWith(
          campaignId,
          expect.stringMatching(/A natural 20! \*\*DM\*\* rolls a \*\*CRITICAL HIT\*\*!$/), // Ends with ! (no extra spaces unless advantage)
          'Roll'
        )
    })
  })

  it('logs CRITICAL MISS format correctly', async () => {
    // Force a 1 (d20). 0 % 20 + 1 = 1.
    const mockGetRandomValues = vi.fn().mockImplementation((array) => {
      array[0] = 0;
      return array;
    });
    Object.defineProperty(window, 'crypto', {
      value: { getRandomValues: mockGetRandomValues },
      writable: true
    });

    render(<DiceRoller campaignId={campaignId} />)
    const d20Button = screen.getByText('d20')
    fireEvent.click(d20Button)

    await waitFor(() => {
        expect(actions.logAction).toHaveBeenCalledWith(
          campaignId,
          expect.stringMatching(/Disaster strikes! \*\*DM\*\* rolls a \*\*CRITICAL MISS\*\*!$/),
          'Roll'
        )
    })
  })

  it('logs CRITICAL HIT format correctly with Advantage', async () => {
     const mockGetRandomValues = vi.fn()
        .mockImplementationOnce((array) => { array[0] = 19; return array; }) // 20
        .mockImplementationOnce((array) => { array[0] = 14; return array; }); // 15
    Object.defineProperty(window, 'crypto', {
      value: { getRandomValues: mockGetRandomValues },
      writable: true
    });

    render(<DiceRoller campaignId={campaignId} />)
    fireEvent.click(screen.getByText('Adv'))
    fireEvent.click(screen.getByText('d20'))

    await waitFor(() => {
        expect(actions.logAction).toHaveBeenCalledWith(
          campaignId,
          expect.stringMatching(/A natural 20! \*\*DM\*\* rolls a \*\*CRITICAL HIT\*\*! \[ADVANTAGE\] \(Rolls: \*\*20\*\*, \*\*15\*\*\)/),
          'Roll'
        )
    })
  })
})
