'use client';

import { useState, useCallback } from 'react';
import { logAction } from '@/app/actions';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { secureRoll } from '@/lib/dice';

type RollMode = 'NORMAL' | 'ADVANTAGE' | 'DISADVANTAGE';

type RollResult = {
    total: number;
    die: number;
    rolls: number[];
    isCrit: boolean;
    isFumble: boolean;
    mode: RollMode;
};

export default function DiceRoller({ campaignId, rollerName = "DM" }: { campaignId: string, rollerName?: string }) {
    const [rollingDie, setRollingDie] = useState<number | null>(null);
    const [mode, setMode] = useState<RollMode>('NORMAL');
    const [lastResult, setLastResult] = useState<RollResult | null>(null);

    const rollDice = useCallback(async (sides: number) => {
        setRollingDie(sides);
        setLastResult(null); // Clear previous result while rolling

        try {
            // Add visual delay for click confidence
            await new Promise(resolve => setTimeout(resolve, 600));

            let result = 0;
            let details = '';
            let rolls: number[] = [];

            // Base roll
            const roll1 = secureRoll(sides);
            rolls.push(roll1);

            if (mode === 'NORMAL') {
                result = roll1;
            } else {
                const roll2 = secureRoll(sides);
                rolls.push(roll2);
                if (mode === 'ADVANTAGE') {
                    result = Math.max(roll1, roll2);
                    details = ` (ADVANTAGE) (Rolls: **${roll1}**, **${roll2}**)`;
                } else {
                    result = Math.min(roll1, roll2);
                    details = ` (DISADVANTAGE) (Rolls: **${roll1}**, **${roll2}**)`;
                }
            }

            const isCrit = sides === 20 && result === 20;
            const isFumble = sides === 20 && result === 1;

            setLastResult({
                total: result,
                die: sides,
                rolls: rolls,
                isCrit,
                isFumble,
                mode
            });

            let logMessage = '';

            if (isCrit) {
                logMessage = `**${rollerName}** rolls a **CRITICAL HIT**!${details}`;
            } else if (isFumble) {
                logMessage = `**${rollerName}** rolls a **CRITICAL MISS**!${details}`;
            } else {
                logMessage = `**${rollerName}** rolls d${sides}: **${result}**.${details}`;
            }

            const resultAction = await logAction(campaignId, logMessage, 'Roll');
            if (!resultAction.success) {
                 console.error('Failed to log roll:', resultAction.error);
            }
        } catch (error) {
            console.error('Failed to log roll:', error);
        } finally {
            setRollingDie(null);
        }
    }, [mode, campaignId, rollerName]);

    const getDiceVariant = () => {
        if (mode === 'ADVANTAGE') return 'success';
        if (mode === 'DISADVANTAGE') return 'destructive';
        return 'agent';
    };

    return (
        <Card variant="agent" className="overflow-hidden">
            <CardHeader className="p-4 flex flex-col gap-4 space-y-0 bg-agent-navy/50 backdrop-blur-sm border-b border-agent-blue/10">
                <div className="flex justify-between items-center h-10">
                    <CardTitle className="text-sm font-black text-agent-blue uppercase tracking-[0.2em]">Dice Tray</CardTitle>
                    {rollingDie !== null ? (
                        <span className="text-sm text-agent-blue animate-pulse font-black tracking-widest drop-shadow-[0_0_5px_rgba(43,43,238,0.8)] uppercase">
                            ROLLING...
                        </span>
                    ) : lastResult ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                             <span className={`text-2xl font-black ${
                                lastResult.isCrit ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' :
                                lastResult.isFumble ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                'text-white'
                            }`}>
                                {lastResult.isCrit ? 'CRIT!' : lastResult.isFumble ? 'MISS!' : lastResult.total}
                            </span>
                            {(lastResult.mode !== 'NORMAL' || lastResult.isCrit || lastResult.isFumble) && (
                                <span className="text-xs text-neutral-400 font-mono">
                                    {lastResult.mode !== 'NORMAL' ? `(${lastResult.rolls.join(', ')})` : `(${lastResult.total})`}
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Mode Toggles - Full width touch targets */}
                <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                    <Button
                        variant={mode === 'NORMAL' ? 'agent' : 'ghost'}
                        onClick={() => setMode('NORMAL')}
                        className={`h-16 p-4 text-xs uppercase font-bold tracking-wider touch-manipulation ${mode !== 'NORMAL' ? 'text-neutral-500 hover:text-white' : 'shadow-[0_0_15px_rgba(43,43,238,0.3)]'}`}
                    >
                        Normal
                    </Button>
                    <Button
                        variant={mode === 'ADVANTAGE' ? 'success' : 'ghost'}
                        onClick={() => setMode('ADVANTAGE')}
                        className={`h-16 p-4 text-xs uppercase font-bold tracking-wider touch-manipulation ${mode === 'ADVANTAGE' ? 'shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-neutral-500 hover:text-emerald-400'}`}
                    >
                        Adv
                    </Button>
                    <Button
                        variant={mode === 'DISADVANTAGE' ? 'destructive' : 'ghost'}
                        onClick={() => setMode('DISADVANTAGE')}
                        className={`h-16 p-4 text-xs uppercase font-bold tracking-wider touch-manipulation ${mode === 'DISADVANTAGE' ? 'shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-neutral-500 hover:text-red-400'}`}
                    >
                        Dis
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-4">
                <div className="grid grid-cols-3 gap-3">
                    {[4, 6, 8, 10, 12, 20].map(d => (
                        <Button
                            key={d}
                            disabled={rollingDie !== null}
                            onClick={() => rollDice(d)}
                            variant={getDiceVariant()}
                            className="font-black text-xl h-16 p-4 w-full rounded-xl active:scale-[0.96] transition-transform shadow-lg touch-manipulation border border-white/5 hover:border-agent-blue/50"
                        >
                            {rollingDie === d ? '...' : `d${d}`}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
