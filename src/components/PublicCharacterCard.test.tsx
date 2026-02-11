import { render, screen } from '@testing-library/react';
import { PublicCharacterCard } from './PublicCharacterCard';
import { describe, it, expect } from 'vitest';
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
        // Check for specific class or style. Note: class names might be hashed or combined, but we use tailwind classes.
        // We look for 'border-agent-blue' which is added conditionally.
        expect(container.firstChild).toHaveClass('border-agent-blue');
    });

    it('displays conditions', () => {
        const condChar = { ...mockChar, conditions: JSON.stringify(['POISONED', 'STUNNED']) };
        render(<PublicCharacterCard character={condChar} />);
        expect(screen.getByText('POISONED')).toBeDefined();
        expect(screen.getByText('STUNNED')).toBeDefined();
    });
});
