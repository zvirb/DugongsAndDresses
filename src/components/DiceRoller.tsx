'use client';

// GAMBLER'S JOURNAL - CRITICAL LEARNINGS ONLY
// Format: ## YYYY-MM-DD - [Dice] Glitch: [Double click caused double log] Fix: [Added isRolling state]
// ## 2024-05-24 - [Dice] Transparency: [Hiding numbers in Crit/Miss logs] Fix: [Added explicit roll numbers to log]
// ## 2024-05-24 - [Dice] Feedback: [Hiding numbers in UI for Crit/Miss] Fix: [Always show number, moved status to badge]

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

const Spinner = () => (
    <svg data-testid="spinner" className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

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
                    details = ` [ADVANTAGE] (Rolls: **${roll1}**, **${roll2}**)`;
                } else {
                    result = Math.min(roll1, roll2);
                    details = ` [DISADVANTAGE] (Rolls: **${roll1}**, **${roll2}**)`;
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
                logMessage = `A natural 20! **${rollerName}** rolls d${sides}: **${result}**.${details}`;
            } else if (isFumble) {
                logMessage = `Disaster strikes! **${rollerName}** rolls d${sides}: **${result}**.${details}`;
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
        <Card variant="agent" className="overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <CardHeader className="p-4 flex flex-col gap-4 space-y-0 bg-agent-navy/80 backdrop-blur-md border-b border-agent-blue/20">
                <div className="flex justify-between items-center h-10">
                    <CardTitle className="text-xs font-black text-agent-blue uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-agent-blue rounded-full animate-pulse shadow-[0_0_5px_#2b2bee]" />
                        Dice Tray
                    </CardTitle>
                    {rollingDie !== null ? (
                        <span className="text-[10px] text-white bg-agent-blue animate-pulse font-black tracking-widest shadow-[0_0_15px_rgba(43,43,238,0.8)] uppercase px-2 py-0.5 rounded-full border border-white/20">
                            CALCULATING...
                        </span>
                    ) : lastResult ? (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                             <span className={`text-4xl font-black italic tracking-tighter ${
                                lastResult.isCrit ? 'text-green-400 drop-shadow-[0_0_25px_rgba(74,222,128,1)]' :
                                lastResult.isFumble ? 'text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,1)]' :
                                'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]'
                            }`}>
                                {lastResult.total}
                            </span>
                            {(lastResult.mode !== 'NORMAL' || lastResult.isCrit || lastResult.isFumble) && (
                                <span className="text-xs text-neutral-400 font-mono opacity-80 bg-black/40 px-1 rounded border border-white/5">
                                    {lastResult.isCrit && 'CRIT! '}
                                    {lastResult.isFumble && 'MISS! '}
                                    {lastResult.mode !== 'NORMAL' ? `[${lastResult.rolls.join(', ')}]` : `[${lastResult.total}]`}
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Mode Toggles - Full width touch targets */}
                <div className="grid grid-cols-3 gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                    <Button
                        variant={mode === 'NORMAL' ? 'agent' : 'ghost'}
                        onClick={() => setMode('NORMAL')}
                        className={`h-14 p-2 text-sm uppercase font-bold tracking-wider touch-manipulation transition-all duration-300 ${mode !== 'NORMAL' ? 'text-neutral-500 hover:text-white hover:bg-white/5' : 'shadow-[0_0_15px_rgba(43,43,238,0.3)] ring-1 ring-agent-blue/50'}`}
                    >
                        Normal
                    </Button>
                    <Button
                        variant={mode === 'ADVANTAGE' ? 'success' : 'ghost'}
                        onClick={() => setMode('ADVANTAGE')}
                        className={`h-14 p-2 text-sm uppercase font-bold tracking-wider touch-manipulation transition-all duration-300 ${mode === 'ADVANTAGE' ? 'shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-1 ring-green-500/50' : 'text-neutral-500 hover:text-emerald-400 hover:bg-emerald-900/20'}`}
                    >
                        Adv
                    </Button>
                    <Button
                        variant={mode === 'DISADVANTAGE' ? 'destructive' : 'ghost'}
                        onClick={() => setMode('DISADVANTAGE')}
                        className={`h-14 p-2 text-sm uppercase font-bold tracking-wider touch-manipulation transition-all duration-300 ${mode === 'DISADVANTAGE' ? 'shadow-[0_0_15px_rgba(220,38,38,0.4)] ring-1 ring-red-500/50' : 'text-neutral-500 hover:text-red-400 hover:bg-red-900/20'}`}
                    >
                        Dis
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-4 bg-black/20">
                <div className="grid grid-cols-3 gap-3">
                    {[4, 6, 8, 10, 12, 20].map(d => (
                        <Button
                            key={d}
                            disabled={rollingDie !== null}
                            onClick={() => rollDice(d)}
                            variant={getDiceVariant()}
                            aria-label={rollingDie === d ? "Rolling" : undefined}
                            className="font-black text-xl h-16 p-4 w-full rounded-xl active:scale-[0.96] transition-transform shadow-lg touch-manipulation border border-white/5 hover:border-agent-blue/50"
                        >
                            {rollingDie === d ? <Spinner /> : `d${d}`}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
