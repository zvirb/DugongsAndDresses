'use client';

import { useState } from 'react';
import { logAction } from '@/app/actions';

type RollMode = 'NORMAL' | 'ADVANTAGE' | 'DISADVANTAGE';

export default function DiceRoller({ campaignId }: { campaignId: string }) {
    const [isRolling, setIsRolling] = useState(false);
    const [mode, setMode] = useState<RollMode>('NORMAL');

    const rollDice = async (sides: number) => {
        setIsRolling(true);
        let result = 0;
        let details = '';

        // Base roll
        const roll1 = Math.floor(Math.random() * sides) + 1;

        if (mode === 'NORMAL') {
            result = roll1;
            details = `[${roll1}]`;
        } else {
            const roll2 = Math.floor(Math.random() * sides) + 1;
            if (mode === 'ADVANTAGE') {
                result = Math.max(roll1, roll2);
                details = `(Adv: [${roll1}, ${roll2}])`;
            } else {
                result = Math.min(roll1, roll2);
                details = `(Dis: [${roll1}, ${roll2}])`;
            }
        }

        const logMessage = `Rolled 1d${sides}${mode !== 'NORMAL' ? ` ${mode.toLowerCase()}` : ''}: **${result}** ${details}`;

        await logAction(campaignId, logMessage, 'Roll');
        setIsRolling(false);
        // Reset to normal after roll? Optional. Keeping sticky for now.
    };

    return (
        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Dice Tray</h3>

                <div className="flex bg-neutral-900 rounded p-1 gap-1">
                    <button
                        onClick={() => setMode('NORMAL')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${mode === 'NORMAL' ? 'bg-neutral-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Normal
                    </button>
                    <button
                        onClick={() => setMode('ADVANTAGE')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${mode === 'ADVANTAGE' ? 'bg-green-800 text-green-100' : 'text-neutral-500 hover:text-green-800'}`}
                    >
                        Adv
                    </button>
                    <button
                        onClick={() => setMode('DISADVANTAGE')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${mode === 'DISADVANTAGE' ? 'bg-red-800 text-red-100' : 'text-neutral-500 hover:text-red-800'}`}
                    >
                        Dis
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {[4, 6, 8, 10, 12, 20].map(d => (
                    <button
                        key={d}
                        disabled={isRolling}
                        onClick={() => rollDice(d)}
                        className={`
                font-bold py-2 rounded transition-colors disabled:opacity-50
                ${mode === 'ADVANTAGE' ? 'bg-green-900/40 hover:bg-green-900 text-green-400 border border-green-800' :
                                mode === 'DISADVANTAGE' ? 'bg-red-900/40 hover:bg-red-900 text-red-400 border border-red-800' :
                                    'bg-neutral-700 hover:bg-neutral-600 text-amber-500'}
            `}
                    >
                        d{d}
                    </button>
                ))}
            </div>
        </div>
    );
}
