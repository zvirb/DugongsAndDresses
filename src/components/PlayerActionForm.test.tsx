import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerActionForm from '@/components/PlayerActionForm';
import { logAction, performAttack, castSpell, updateConditions, performDodge, performDash } from '@/app/actions';

// Mock the actions
vi.mock('@/app/actions', () => ({
    logAction: vi.fn(),
    performAttack: vi.fn(),
    castSpell: vi.fn(),
    updateConditions: vi.fn(),
    performDodge: vi.fn(),
    performDash: vi.fn(),
    performLongRest: vi.fn(),
}));

describe('PlayerActionForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(logAction).mockResolvedValue({ success: true, data: {} });
        vi.mocked(performAttack).mockResolvedValue({ success: true, data: {} });
        vi.mocked(castSpell).mockResolvedValue({ success: true, data: {} });
        vi.mocked(updateConditions).mockResolvedValue({ success: true, data: {} });
        vi.mocked(performDodge).mockResolvedValue({ success: true, data: {} });
        vi.mocked(performDash).mockResolvedValue({ success: true, data: {} });
    });

    it('renders the form and quick intent buttons', () => {
        render(<PlayerActionForm characterName="TestChar" campaignId="campaign1" characterId="char1" />);

        expect(screen.getByPlaceholderText('I swing my axe...')).toBeDefined();
        expect(screen.getByText('Attack')).toBeDefined();
        expect(screen.getByText('Cast')).toBeDefined();
        expect(screen.getByText('Dodge')).toBeDefined();
        expect(screen.getByText('Dash')).toBeDefined();
    });

    it('switches to ATTACK mode and submits attack', async () => {
        render(<PlayerActionForm characterName="TestChar" campaignId="campaign1" characterId="char1" />);

        fireEvent.click(screen.getByText('Attack'));

        // Should show weapon input
        const weaponInput = screen.getByPlaceholderText('e.g. Greataxe');
        expect(weaponInput).toBeDefined();

        fireEvent.change(weaponInput, { target: { value: 'Sword' } });
        fireEvent.change(screen.getByPlaceholderText('d20'), { target: { value: '18' } });

        const submitBtn = screen.getByText('ATTACK');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(performAttack).toHaveBeenCalledWith(
                "char1",
                undefined,
                undefined,
                18
            );
        });
    });

    it('switches to CAST mode and submits spell', async () => {
        render(<PlayerActionForm characterName="TestChar" campaignId="campaign1" characterId="char1" />);

        fireEvent.click(screen.getByText('Cast'));

        // Should show spell input
        const spellInput = screen.getByPlaceholderText('e.g. Fireball');
        expect(spellInput).toBeDefined();

        fireEvent.change(spellInput, { target: { value: 'Magic Missile' } });

        const submitBtn = screen.getByText('CAST');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(castSpell).toHaveBeenCalledWith(
                "char1",
                undefined,
                "Magic Missile"
            );
        });
    });

    it('performs Dodge action immediately', async () => {
        // Mock confirm
        window.confirm = vi.fn(() => true);

        render(<PlayerActionForm characterName="TestChar" campaignId="campaign1" characterId="char1" />);

        fireEvent.click(screen.getByText('Dodge'));

        await waitFor(() => {
            expect(performDodge).toHaveBeenCalledWith("char1");
        });
    });

    it('performs Dash action immediately', async () => {
        render(<PlayerActionForm characterName="TestChar" campaignId="campaign1" characterId="char1" />);

        fireEvent.click(screen.getByText('Dash'));

        await waitFor(() => {
            expect(performDash).toHaveBeenCalledWith("char1");
        });
    });

    it('submits generic intent via text input', async () => {
        render(<PlayerActionForm characterName="TestChar" campaignId="campaign1" characterId="char1" />);

        const input = screen.getByPlaceholderText('I swing my axe...');
        fireEvent.change(input, { target: { value: 'Do a flip' } });

        const submitBtn = screen.getByText('EXECUTE');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(logAction).toHaveBeenCalledWith(
                "campaign1",
                "**TestChar** attempts: **Do a flip**.",
                "PlayerAction"
            );
        });
    });
});
