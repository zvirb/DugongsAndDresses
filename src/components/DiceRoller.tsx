'use client';

// GAMBLER'S JOURNAL - CRITICAL LEARNINGS ONLY
// Format: ## YYYY-MM-DD - [Dice] Glitch: [Double click caused double log] Fix: [Added isRolling state]
// ## 2024-05-24 - [Dice] Transparency: [Hiding numbers in Crit/Miss logs] Fix: [Added explicit roll numbers to log]
// ## 2024-05-24 - [Dice] Feedback: [Hiding numbers in UI for Crit/Miss] Fix: [Always show number, moved status to badge]
// ## 2025-05-25 - [Dice] Feedback: [Vague "CALCULATING..." message] Fix: [Changed to "ROLLING dX..." for specificity]
// ## 2025-05-26 - [Dice] Interaction: [Buttons small for mobile] Fix: [Increased dice buttons to h-20, modes to h-16]
// ## 2025-05-27 - [Dice] Logic: [Possible zero-sided die] Fix: [Added guard clause for sides < 1]
// ## 2025-05-27 - [Dice] Transparency: [Advantage logs redundant] Fix: [Simplified format to [ADVANTAGE: X, Y]]
// ## 2025-05-27 - [Dice] Interaction: [Mode switching while rolling] Fix: [Disabled mode toggles during roll]
// ## 2025-05-28 - [Dice] Log: [Period placement in Advantage logs] Fix: [Moved period to end of sentence]
// ## 2025-05-29 - [Dice] Feedback: [Static result on Crit/Miss] Fix: [Added animate-bounce for dramatic effect]
// ## 2025-05-30 - [Dice] Safety: [Guard clause missing] Fix: [Added explicit return for sides < 1]
// ## 2025-05-30 - [Dice] UI: [Rolling badge small] Fix: [Increased text size to text-xs]
// ## 2025-05-31 - [Dice] Feedback: [Rolling state colors static] Fix: [Added mode-specific colors for rolling feedback]
// ## 2025-06-01 - [Dice] Log: [Improved log format] Fix: [Refined "Advantage/Disadvantage" text and Rolling feedback]
// ## 2025-06-08 - [Dice] Visual: [Updated colors to Agent Mesh] Fix: [Replaced generic yellow/green/red with agent-blue/emerald/rose and added glows]
// ## 2025-06-09 - [Dice] Feedback: [Single number animation for Adv/Dis] Fix: [Animating both dice values during roll]
// ## 2025-06-10 - [Layout] Compactness: [Buttons taking too much vertical space] Fix: [Reduced dice buttons to h-16]
// ## 2025-06-11 - [Dice] Log: [Verbose Advantage logs] Fix: [Simplified format to [Advantage: X, Y]]
// ## 2025-06-12 - [Dice] Log: [Unordered Advantage logs] Fix: [Sorted Advantage (High->Low) and Disadvantage (Low->High) for clarity]

import { useState, useCallback, useEffect } from 'react';
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
    <svg data-testid="spinner" className="animate-spin h-6 w-6 text-agent-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function DiceRoller({ campaignId, rollerName = "DM" }: { campaignId: string, rollerName?: string }) {
    const [rollingDie, setRollingDie] = useState<number | null>(null);
    const [displayValues, setDisplayValues] = useState<number[] | null>(null);
    const [mode, setMode] = useState<RollMode>('NORMAL');
    const [lastResult, setLastResult] = useState<RollResult | null>(null);

    useEffect(() => {
        if (!rollingDie) {
            setDisplayValues(null);
            return;
        }

        const interval = setInterval(() => {
            if (mode === 'NORMAL') {
                setDisplayValues([Math.floor(Math.random() * rollingDie) + 1]);
            } else {
                 setDisplayValues([
                    Math.floor(Math.random() * rollingDie) + 1,
                    Math.floor(Math.random() * rollingDie) + 1
                 ]);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [rollingDie, mode]);

    const rollDice = useCallback(async (sides: number) => {
        // Safety check: A die must have at least 1 side.
        if (sides < 1) return;

        setRollingDie(sides);
        // Initialize displayValues based on mode to ensure immediate visual feedback
        if (mode === 'NORMAL') {
            setDisplayValues([1]);
        } else {
            setDisplayValues([1, 1]);
        }
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
                    // Sort Descending: High, Low
                    rolls.sort((a, b) => b - a);
                    details = ` [Advantage: **${rolls[0]}**, **${rolls[1]}**]`;
                } else {
                    result = Math.min(roll1, roll2);
                    // Sort Ascending: Low, High
                    rolls.sort((a, b) => a - b);
                    details = ` [Disadvantage: **${rolls[0]}**, **${rolls[1]}**]`;
                }
            }

            const isCrit = sides === 20 && result === 20;
            const isFumble = sides === 20 && result === 1;

            const rollData = {
                total: result,
                die: sides,
                rolls: rolls,
                isCrit,
                isFumble,
                mode
            };

            setLastResult(rollData);

            if (typeof window !== 'undefined') {
                const event = new CustomEvent('dice-roll-complete', { detail: rollData });
                window.dispatchEvent(event);
            }

            let logMessage = '';

            if (isCrit) {
                logMessage = `A natural 20! **${rollerName}** rolls d${sides}: **${result}**${details}.`;
            } else if (isFumble) {
                logMessage = `Disaster strikes! **${rollerName}** rolls d${sides}: **${result}**${details}.`;
            } else {
                logMessage = `**${rollerName}** rolls d${sides}: **${result}**${details}.`;
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

    const getModeColors = () => {
        switch (mode) {
            case 'ADVANTAGE':
                return {
                    text: 'text-emerald-400',
                    bg: 'bg-emerald-400',
                    shadow: 'drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]',
                    badgeShadow: 'shadow-[0_0_20px_rgba(52,211,153,0.6)]',
                    border: 'border-emerald-200'
                };
            case 'DISADVANTAGE':
                 return {
                    text: 'text-rose-500',
                    bg: 'bg-rose-500',
                    shadow: 'drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]',
                    badgeShadow: 'shadow-[0_0_20px_rgba(244,63,94,0.6)]',
                    border: 'border-rose-200'
                };
            default:
                return {
                    text: 'text-agent-blue',
                    bg: 'bg-agent-blue',
                    shadow: 'drop-shadow-[0_0_15px_rgba(43,43,238,0.8)]',
                    badgeShadow: 'shadow-[0_0_20px_rgba(43,43,238,0.6)]',
                    border: 'border-agent-blue/50'
                };
        }
    };

    const modeColors = getModeColors();

    return (
        <Card variant="agent" className="overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <CardHeader className="p-4 flex flex-col gap-4 space-y-0 bg-agent-navy/80 backdrop-blur-md border-b border-agent-blue/20">
                <div className="flex justify-between items-center h-10">
                    <CardTitle className="text-xs font-black text-agent-blue uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-agent-blue rounded-full animate-pulse shadow-[0_0_5px_#2b2bee]" />
                        Dice Tray
                    </CardTitle>
                    {rollingDie !== null && displayValues ? (
                        <div className="flex items-center gap-3">
                             <span className={`text-3xl font-black italic tracking-tighter whitespace-nowrap ${modeColors.text} ${modeColors.shadow} animate-pulse font-mono`}>
                                {displayValues.join(' | ')}
                            </span>
                            <span className={`text-xs text-black ${modeColors.bg} animate-pulse font-black tracking-widest ${modeColors.badgeShadow} uppercase px-2 py-0.5 rounded-full border ${modeColors.border}`}>
                                ROLLING d{rollingDie}...
                            </span>
                        </div>
                    ) : lastResult ? (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                             <span className={`text-4xl font-black italic tracking-tighter ${
                                lastResult.isCrit ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,1)] animate-bounce' :
                                lastResult.isFumble ? 'text-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,1)] animate-bounce' :
                                'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]'
                            }`}>
                                {lastResult.total}
                            </span>
                            {(lastResult.mode !== 'NORMAL' || lastResult.isCrit || lastResult.isFumble) && (
                                <span className="text-xs text-agent-blue/60 font-mono opacity-80 bg-agent-navy/40 px-1 rounded border border-agent-blue/10">
                                    {lastResult.isCrit && 'CRIT! '}
                                    {lastResult.isFumble && 'MISS! '}
                                    {lastResult.mode !== 'NORMAL' ? `[${lastResult.rolls.join(', ')}]` : `[${lastResult.total}]`}
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Mode Toggles - Full width touch targets */}
                <div className="grid grid-cols-3 gap-2 bg-agent-navy/40 p-2 rounded-xl border border-white/5">
                    <Button
                        variant={mode === 'NORMAL' ? 'agent' : 'ghost'}
                        onClick={() => setMode('NORMAL')}
                        disabled={rollingDie !== null}
                        className={`h-16 p-2 text-sm uppercase font-bold tracking-wider touch-manipulation transition-all duration-300 active:scale-95 active:brightness-90 ${mode !== 'NORMAL' ? 'text-agent-blue/40 hover:text-white hover:bg-agent-blue/10' : 'shadow-[0_0_15px_rgba(43,43,238,0.3)] ring-1 ring-agent-blue/50'}`}
                    >
                        Normal
                    </Button>
                    <Button
                        variant={mode === 'ADVANTAGE' ? 'success' : 'ghost'}
                        onClick={() => setMode('ADVANTAGE')}
                        disabled={rollingDie !== null}
                        className={`h-16 p-2 text-sm uppercase font-bold tracking-wider touch-manipulation transition-all duration-300 active:scale-95 active:brightness-90 ${mode === 'ADVANTAGE' ? 'shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-1 ring-emerald-500/50' : 'text-agent-blue/40 hover:text-emerald-400 hover:bg-emerald-900/20'}`}
                    >
                        Adv
                    </Button>
                    <Button
                        variant={mode === 'DISADVANTAGE' ? 'destructive' : 'ghost'}
                        onClick={() => setMode('DISADVANTAGE')}
                        disabled={rollingDie !== null}
                        className={`h-16 p-2 text-sm uppercase font-bold tracking-wider touch-manipulation transition-all duration-300 active:scale-95 active:brightness-90 ${mode === 'DISADVANTAGE' ? 'shadow-[0_0_15px_rgba(220,38,38,0.4)] ring-1 ring-rose-500/50' : 'text-agent-blue/40 hover:text-rose-400 hover:bg-rose-900/20'}`}
                    >
                        Dis
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-4 bg-agent-navy/20">
                <div className="grid grid-cols-3 gap-4">
                    {[4, 6, 8, 10, 12, 20].map(d => (
                        <Button
                            key={d}
                            disabled={rollingDie !== null}
                            onClick={() => rollDice(d)}
                            variant={getDiceVariant()}
                            aria-label={rollingDie === d ? "Rolling" : undefined}
                            className="font-black text-2xl h-16 p-2 w-full rounded-xl active:scale-95 active:brightness-90 transition-transform shadow-lg touch-manipulation border border-white/5 hover:border-agent-blue/50"
                        >
                            {rollingDie === d ? <Spinner /> : `d${d}`}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
