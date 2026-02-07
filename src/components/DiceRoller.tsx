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
            details = `[${roll1}]`;
        } else {
            const roll2 = secureRoll(sides);
            if (mode === 'ADVANTAGE') {
                result = Math.max(roll1, roll2);
                details = `(Adv: [${roll1}, ${roll2}])`;
            } else {
                result = Math.min(roll1, roll2);
                details = `(Dis: [${roll1}, ${roll2}])`;
            }
        }

        const logMessage = `**${rollerName}** rolled 1d${sides}${mode !== 'NORMAL' ? ` ${mode.toLowerCase()}` : ''}: **${result}** ${details}`;

        await logAction(campaignId, logMessage, 'Roll');
        setRollingDie(null);
    }, [mode, campaignId, rollerName]);

    const getDiceVariant = () => {
        if (mode === 'ADVANTAGE') return 'success';
        if (mode === 'DISADVANTAGE') return 'destructive';
        return 'primary';
    };

    return (
        <Card className="border-neutral-700 bg-neutral-800">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Dice Tray</CardTitle>
                <div className="flex bg-neutral-900 rounded p-1 gap-1">
                    <Button
                        size="sm"
                        variant={mode === 'NORMAL' ? 'secondary' : 'ghost'}
                        onClick={() => setMode('NORMAL')}
                        className={`h-7 px-2 text-xs ${mode === 'NORMAL' ? 'bg-neutral-600 text-white' : ''}`}
                    >
                        Normal
                    </Button>
                    <Button
                        size="sm"
                        variant={mode === 'ADVANTAGE' ? 'success' : 'ghost'}
                        onClick={() => setMode('ADVANTAGE')}
                        className={`h-7 px-2 text-xs ${mode === 'ADVANTAGE' ? '' : 'hover:text-green-500'}`}
                    >
                        Adv
                    </Button>
                    <Button
                        size="sm"
                        variant={mode === 'DISADVANTAGE' ? 'destructive' : 'ghost'}
                        onClick={() => setMode('DISADVANTAGE')}
                        className={`h-7 px-2 text-xs ${mode === 'DISADVANTAGE' ? '' : 'hover:text-red-500'}`}
                    >
                        Dis
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-3 gap-2">
                    {[4, 6, 8, 10, 12, 20].map(d => (
                        <Button
                            key={d}
                            disabled={rollingDie !== null}
                            onClick={() => rollDice(d)}
                            variant={getDiceVariant()}
                            className="font-bold w-full"
                        >
                            {rollingDie === d ? 'Rolling...' : `d${d}`}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}