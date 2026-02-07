'use client';

import { useState, useCallback } from 'react';
import { logAction } from '@/app/actions';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';

type RollMode = 'NORMAL' | 'ADVANTAGE' | 'DISADVANTAGE';

export default function DiceRoller({ campaignId, rollerName = 'DM' }: { campaignId: string, rollerName?: string }) {
    const [isRolling, setIsRolling] = useState(false);
    const [mode, setMode] = useState<RollMode>('NORMAL');

    const rollDice = useCallback(async (sides: number) => {
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

        const logMessage = `${rollerName} rolled 1d${sides}${mode !== 'NORMAL' ? ` ${mode.toLowerCase()}` : ''}: **${result}** ${details}`;

        await logAction(campaignId, logMessage, 'Roll');
        setIsRolling(false);
    }, [mode, campaignId, rollerName]);

    const getDiceVariant = () => {
        if (mode === 'ADVANTAGE') return 'success';
        if (mode === 'DISADVANTAGE') return 'destructive';
        return 'primary';
    };

    return (
        <Card className="border-white/5 bg-black/40">
            <CardHeader className="p-4 flex flex-col gap-4 space-y-0">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-black text-neutral-500 uppercase tracking-[0.2em]">Dice Tray</CardTitle>
                    {isRolling && <span className="text-xs text-agent-blue animate-pulse">Rolling...</span>}
                </div>

                {/* Mode Toggles - Full width touch targets */}
                <div className="grid grid-cols-3 gap-2 bg-black/20 p-1 rounded-xl">
                    <Button
                        size="sm"
                        variant={mode === 'NORMAL' ? 'secondary' : 'ghost'}
                        onClick={() => setMode('NORMAL')}
                        className={`h-12 text-xs uppercase font-bold tracking-wider ${mode === 'NORMAL' ? 'bg-neutral-700 text-white shadow-lg' : 'text-neutral-500'}`}
                    >
                        Normal
                    </Button>
                    <Button
                        size="sm"
                        variant={mode === 'ADVANTAGE' ? 'success' : 'ghost'}
                        onClick={() => setMode('ADVANTAGE')}
                        className={`h-12 text-xs uppercase font-bold tracking-wider ${mode === 'ADVANTAGE' ? 'shadow-lg shadow-emerald-900/20' : 'text-neutral-500 hover:text-emerald-500'}`}
                    >
                        Adv
                    </Button>
                    <Button
                        size="sm"
                        variant={mode === 'DISADVANTAGE' ? 'destructive' : 'ghost'}
                        onClick={() => setMode('DISADVANTAGE')}
                        className={`h-12 text-xs uppercase font-bold tracking-wider ${mode === 'DISADVANTAGE' ? 'shadow-lg shadow-red-900/20' : 'text-neutral-500 hover:text-red-500'}`}
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
                            disabled={isRolling}
                            onClick={() => rollDice(d)}
                            variant={getDiceVariant()}
                            className="font-black text-xl h-16 w-full rounded-xl active:scale-[0.96] transition-transform shadow-lg"
                        >
                            d{d}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
