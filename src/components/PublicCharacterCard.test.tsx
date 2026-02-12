import { render, screen, act } from '@testing-library/react';
import { PublicCharacterCard } from './PublicCharacterCard';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Character } from '@/types';

describe('PublicCharacterCard', () => {
    const mockChar = {
        id: '1',
        name: 'Test Char',
        race: 'Human',
        class: 'Fighter',
        level: 5,
        hp: 50,
        maxHp: 100,
        armorClass: 18,
        activeTurn: false,
        imageUrl: null,
        conditions: "[]"
    } as unknown as Character;

    it('renders character info correctly', () => {
        render(<PublicCharacterCard character={mockChar} />);
        expect(screen.getByText('Test Char')).toBeDefined();
        expect(screen.getByText('Human // Fighter')).toBeDefined();
        expect(screen.getByText('50')).toBeDefined();
        expect(screen.getByText('18')).toBeDefined();
    });

    it('displays active turn styling', () => {
        const activeChar = { ...mockChar, activeTurn: true };
        const { container } = render(<PublicCharacterCard character={activeChar} />);
        expect(container.firstChild).toHaveClass('border-agent-blue');
    });

    it('displays conditions', () => {
        const condChar = { ...mockChar, conditions: JSON.stringify(['POISONED', 'STUNNED']) };
        render(<PublicCharacterCard character={condChar} />);
        expect(screen.getByText('POISONED')).toBeDefined();
        expect(screen.getByText('STUNNED')).toBeDefined();
    });
});

describe('PublicCharacterCard Flash Animation', () => {
    const mockChar = {
        id: '1',
        name: 'Test Char',
        race: 'Human',
        class: 'Fighter',
        level: 5,
        hp: 50,
        maxHp: 100,
        armorClass: 18,
        activeTurn: false,
        imageUrl: null,
        conditions: "[]"
    } as unknown as Character;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('flashes red on damage', () => {
        const { rerender, container } = render(<PublicCharacterCard character={mockChar} />);
        const overlay = container.querySelector('.z-50');
        expect(overlay).toHaveClass('opacity-0');

        const damagedChar = { ...mockChar, hp: 40 };
        rerender(<PublicCharacterCard character={damagedChar} />);

        expect(overlay).toHaveClass('bg-red-600/40');
        expect(overlay).toHaveClass('opacity-100');

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(overlay).toHaveClass('opacity-0');
    });

    it('flashes green on heal', () => {
        const { rerender, container } = render(<PublicCharacterCard character={mockChar} />);
        const overlay = container.querySelector('.z-50');

        const healedChar = { ...mockChar, hp: 60 };
        rerender(<PublicCharacterCard character={healedChar} />);

        expect(overlay).toHaveClass('bg-green-500/40');
        expect(overlay).toHaveClass('opacity-100');

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(overlay).toHaveClass('opacity-0');
    });
});
