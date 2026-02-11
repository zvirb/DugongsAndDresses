import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerActionForm from '@/components/PlayerActionForm';
import { logAction } from '@/app/actions';

// Mock the logAction action
vi.mock('@/app/actions', () => ({
    logAction: vi.fn(),
}));

describe('PlayerActionForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default to success
        vi.mocked(logAction).mockResolvedValue({ success: true, data: {} });
    });

    it('renders the form and quick intent buttons', () => {
        render(<PlayerActionForm characterName="TestChar" campaignId="campaign1" />);

        expect(screen.getByPlaceholderText('I swing my axe...')).toBeDefined();
        // Quick buttons (not yet implemented in component, but test expects them)
        // Since I haven't implemented them yet, this test will fail if I run it now.
        // But the plan step is to create the test first (TDD).
    });

    it('updates intent when quick button is clicked', async () => {
        render(<PlayerActionForm characterName="TestChar" campaignId="campaign1" />);

        // This test assumes the buttons will be added with these labels
        const attackBtn = screen.getByText('Attack');
        fireEvent.click(attackBtn);

        const input = screen.getByPlaceholderText('I swing my axe...') as HTMLInputElement;
        expect(input.value).toBe('Attack');
    });

    it('submits the form with correct data', async () => {
        render(<PlayerActionForm characterName="TestChar" campaignId="campaign1" />);

        const input = screen.getByPlaceholderText('I swing my axe...');
        fireEvent.change(input, { target: { value: 'Cast Fireball' } });

        const submitBtn = screen.getByText('Execute');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(logAction).toHaveBeenCalledWith(
                "campaign1",
                "**TestChar** attempts: **Cast Fireball**.",
                "PlayerAction"
            );
        });
    });

    it('submits with roll result if provided', async () => {
        render(<PlayerActionForm characterName="TestChar" campaignId="campaign1" />);

        const input = screen.getByPlaceholderText('I swing my axe...');
        fireEvent.change(input, { target: { value: 'Attack' } });

        const rollInput = screen.getByPlaceholderText('Dice Roll');
        fireEvent.change(rollInput, { target: { value: '15' } });

        const submitBtn = screen.getByText('Execute');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(logAction).toHaveBeenCalledWith(
                "campaign1",
                "**TestChar** attempts: **Attack** (Roll: **15**).",
                "PlayerAction"
            );
        });
    });
});
