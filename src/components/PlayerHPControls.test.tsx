import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlayerHPControls from '@/components/PlayerHPControls';
import { updateHP } from '@/app/actions';

// Mock the updateHP action
vi.mock('@/app/actions', () => ({
    updateHP: vi.fn(),
}));

describe('PlayerHPControls', () => {
    it('renders HP change buttons', () => {
        render(<PlayerHPControls characterId="1" currentHp={10} maxHp={20} />);
        
        expect(screen.getByText('-1')).toBeDefined();
        expect(screen.getByText('+1')).toBeDefined();
        expect(screen.getByText('-5')).toBeDefined();
        expect(screen.getByText('+5')).toBeDefined();
    });

    it('prevents HP from going below 0', () => {
        render(<PlayerHPControls characterId="1" currentHp={0} maxHp={20} />);
        
        const minusOneBtn = screen.getByText('-1');
        fireEvent.click(minusOneBtn);
        
        expect(updateHP).not.toHaveBeenCalled();
    });
});
