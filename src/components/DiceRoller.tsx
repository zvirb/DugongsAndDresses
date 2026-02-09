'use client';

import { useState, useCallback } from 'react';
import { logAction } from '@/app/actions';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';

type RollMode = 'NORMAL' | 'ADVANTAGE' | 'DISADVANTAGE';

function secureRoll(sides: number): number {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] % sides) + 1;
}

export default function DiceRoller({ campaignId, rollerName = "DM" }: { campaignId: string, rollerName?: string }) {
    const [rollingDie, setRollingDie] = useState<number | null>(null);
    const [mode, setMode] = useState<RollMode>('NORMAL');

    const rollDice = useCallback(async (sides: number) => {
        setRollingDie(sides);

        // Add visual delay for click confidence
        await new Promise(resolve => setTimeout(resolve, 600));

        let result = 0;
        let details = '';

        // Base roll
        const roll1 = secureRoll(sides);

        if (mode === 'NORMAL') {
            result = roll1;
        } else {
            const roll2 = secureRoll(sides);
            if (mode === 'ADVANTAGE') {
                result = Math.max(roll1, roll2);
                details = ` (Rolls: **${roll1}**, **${roll2}**)`;
            } else {
                result = Math.min(roll1, roll2);
                details = ` (Rolls: **${roll1}**, **${roll2}**)`;
            }
        }

        let logMessage = '';

        if (sides === 20 && result === 20) {
            logMessage = `**${rollerName}** rolls a **CRITICAL HIT**! (Result: **20**)${mode !== 'NORMAL' ? ` (${mode})` : ''}${details}`;
        } else if (sides === 20 && result === 1) {
            logMessage = `**${rollerName}** rolls a **CRITICAL MISS**! (Result: **1**)${mode !== 'NORMAL' ? ` (${mode})` : ''}${details}`;
        } else {
            logMessage = `**${rollerName}** casts the die (d${sides})... **${result}**!${mode !== 'NORMAL' ? ` (${mode})` : ''}${details}`;
        }

        await logAction(campaignId, logMessage, 'Roll');
        setRollingDie(null);
    }, [mode, campaignId, rollerName]);

    const getDiceVariant = () => {
        if (mode === 'ADVANTAGE') return 'success';
        if (mode === 'DISADVANTAGE') return 'destructive';
        return 'agent';
    };

    return (
        <Card variant="agent" className="overflow-hidden">
            <CardHeader className="p-4 flex flex-col gap-4 space-y-0">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-black text-agent-blue uppercase tracking-[0.2em]">Dice Tray</CardTitle>
                    {rollingDie !== null && <span className="text-xs text-white animate-pulse font-bold tracking-wider">ROLLING...</span>}
                </div>

                {/* Mode Toggles - Full width touch targets */}
                <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                    <Button
                        variant={mode === 'NORMAL' ? 'agent' : 'ghost'}
                        onClick={() => setMode('NORMAL')}
                        className={`h-14 p-4 text-xs uppercase font-bold tracking-wider ${mode !== 'NORMAL' ? 'text-neutral-500 hover:text-white' : ''}`}
                    >
                        Normal
                    </Button>
                    <Button
                        variant={mode === 'ADVANTAGE' ? 'success' : 'ghost'}
                        onClick={() => setMode('ADVANTAGE')}
                        className={`h-14 p-4 text-xs uppercase font-bold tracking-wider ${mode === 'ADVANTAGE' ? 'shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-neutral-500 hover:text-emerald-400'}`}
                    >
                        Adv
                    </Button>
                    <Button
                        variant={mode === 'DISADVANTAGE' ? 'destructive' : 'ghost'}
                        onClick={() => setMode('DISADVANTAGE')}
                        className={`h-14 p-4 text-xs uppercase font-bold tracking-wider ${mode === 'DISADVANTAGE' ? 'shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-neutral-500 hover:text-red-400'}`}
                    >
                        Dis
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-3 gap-3">
                    {[4, 6, 8, 10, 12, 20].map(d => (
                        <Button
                            key={d}
                            disabled={rollingDie !== null}
                            onClick={() => rollDice(d)}
                            variant={getDiceVariant()}
                            className="font-black text-xl h-16 p-4 w-full rounded-xl active:scale-[0.96] transition-transform shadow-lg"
                        >
                            {rollingDie === d ? '...' : `d${d}`}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
