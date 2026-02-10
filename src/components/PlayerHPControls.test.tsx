import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerHPControls from '@/components/PlayerHPControls';
import { updateHP } from '@/app/actions';

// Mock the updateHP action
vi.mock('@/app/actions', () => ({
    updateHP: vi.fn(),
}));

describe('PlayerHPControls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default to success
        vi.mocked(updateHP).mockResolvedValue({ success: true, data: {} });
    });

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

    it('calls updateHP when button clicked', async () => {
        render(<PlayerHPControls characterId="1" currentHp={10} maxHp={20} />);

        const plusOneBtn = screen.getByText('+1');
        fireEvent.click(plusOneBtn);

        await waitFor(() => {
            expect(updateHP).toHaveBeenCalledWith("1", 1);
        });
    });

    it('optimistically updates UI', async () => {
        render(<PlayerHPControls characterId="1" currentHp={10} maxHp={20} />);

        const plusOneBtn = screen.getByText('+1');
        fireEvent.click(plusOneBtn);

        // Should see 11 immediately (optimistic)
        expect(screen.getByText('11')).toBeInTheDocument();

        await waitFor(() => {
            expect(updateHP).toHaveBeenCalled();
        });
    });

    it('reverts optimistic update on server error', async () => {
        // Mock failure
        vi.mocked(updateHP).mockResolvedValueOnce({ success: false, error: "Failed" });

        render(<PlayerHPControls characterId="1" currentHp={10} maxHp={20} />);

        const plusOneBtn = screen.getByText('+1');
        fireEvent.click(plusOneBtn);

        // Optimistic update first
        expect(screen.getByText('11')).toBeInTheDocument();

        // Wait for revert
        await waitFor(() => {
            expect(screen.getByText('10')).toBeInTheDocument();
        });
    });
});
