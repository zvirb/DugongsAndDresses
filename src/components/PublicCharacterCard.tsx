'use client';

import { useEffect, useState, useRef } from 'react';
import { Badge } from "@/components/ui/Badge";
import { Character } from '@/types';
import { parseConditions } from "@/lib/safe-json";

interface PublicCharacterCardProps {
    character: Pick<Character, 'id' | 'activeTurn' | 'imageUrl' | 'level' | 'armorClass' | 'name' | 'race' | 'class' | 'hp' | 'maxHp' | 'conditions'>;
}

export function PublicCharacterCard({ character }: PublicCharacterCardProps) {
    const conditions = parseConditions(character.conditions);
    const [displayHp, setDisplayHp] = useState(character.hp);
    const [flashState, setFlashState] = useState<'damage' | 'heal' | null>(null);
    const animationFrameRef = useRef<number>();
    const startTimeRef = useRef<number>();
    const startValueRef = useRef<number>(character.hp);
    const prevHpRef = useRef<number>(character.hp);

    useEffect(() => {
        // If HP hasn't changed, ensure display matches (e.g. initial load or re-sync)
        if (displayHp === character.hp) return;

        // Flash Logic
        if (character.hp < prevHpRef.current) {
            setFlashState('damage');
            setTimeout(() => setFlashState(null), 500);
        } else if (character.hp > prevHpRef.current) {
            setFlashState('heal');
            setTimeout(() => setFlashState(null), 500);
        }
        prevHpRef.current = character.hp;

        startValueRef.current = displayHp;
        startTimeRef.current = undefined; // Reset start time

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / 1000, 1); // 1 second duration

            const newValue = Math.floor(startValueRef.current + (character.hp - startValueRef.current) * progress);
            setDisplayHp(newValue);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [character.hp]);

    // Calculate width for bar animation
    const hpPercent = Math.min(100, (character.hp / character.maxHp) * 100);

    return (
        <div
            className={`
                relative overflow-hidden rounded-3xl transition-all duration-500 backdrop-blur-xl group ${flashState === 'damage' ? 'animate-shake' : ''}
                ${character.hp <= 0 ? 'grayscale brightness-50' : ''}
                ${character.activeTurn
                    ? 'border-8 border-agent-blue shadow-[0_0_150px_rgba(43,43,238,0.9),inset_0_0_60px_rgba(43,43,238,0.3)] bg-agent-navy/95 scale-105 z-30 ring-4 ring-agent-blue/50 ring-offset-4 ring-offset-agent-navy'
                    : character.hp > 0 && character.hp <= character.maxHp * 0.2
                        ? 'border-4 border-red-500/50 bg-red-900/10 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse'
                        : 'border-4 border-white/5 bg-white/5 grayscale-[0.8] hover:grayscale-0 hover:border-white/20 hover:bg-black/40'}
            `}
        >
            {/* Unconscious Overlay */}
            {character.hp <= 0 && (
                <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-red-900/20 animate-pulse" />
                    <h2 className="text-9xl font-black text-red-600 uppercase tracking-widest -rotate-12 border-8 border-red-600 p-8 bg-black/90 backdrop-blur-md shadow-[0_0_80px_rgba(220,38,38,0.8)] animate-heartbeat mix-blend-hard-light">
                        Unconscious
                    </h2>
                </div>
            )}

            {/* Flash Overlay */}
            <div className={`absolute inset-0 pointer-events-none z-50 transition-opacity duration-500 ${flashState === 'damage' ? 'bg-red-600/40 opacity-100 mix-blend-overlay' : flashState === 'heal' ? 'bg-green-500/40 opacity-100 mix-blend-overlay' : 'opacity-0'}`} />

            {/* Active Turn Scanner Effect - Enhanced */}
            {character.activeTurn && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                    <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(43,43,238,0.1),transparent)] bg-[length:200%_100%] animate-shimmer" />
                    <div className="absolute top-0 left-0 w-full h-2 bg-agent-blue shadow-[0_0_50px_#2b2bee] animate-[scan_2s_linear_infinite]" />
                    <div className="absolute inset-0 border-2 border-agent-blue/30 rounded-3xl opacity-50" />
                    {/* Corner Reticles */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-agent-blue animate-pulse" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-agent-blue animate-pulse" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-agent-blue animate-pulse" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-agent-blue animate-pulse" />
                </div>
            )}

            <div className="relative z-10 p-6 flex flex-col h-full min-h-[500px]">
                {/* Portrait Background */}
                {character.imageUrl && (
                    <div className="absolute inset-0 z-[-1] opacity-40 mix-blend-overlay group-hover:opacity-60 transition-opacity duration-500">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={character.imageUrl} alt="" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-agent-navy via-agent-navy/70 to-transparent" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,#101022_100%)] opacity-80" />
                    </div>
                )}

                <div className="mb-auto">
                    <div className="flex justify-between items-start mb-6">
                        <Badge variant={character.activeTurn ? 'agent' : 'player'} className={`font-black italic text-5xl !text-5xl !px-6 !py-3 uppercase tracking-widest shadow-lg ${character.activeTurn ? 'animate-pulse' : ''}`}>
                            LVL {character.level}
                        </Badge>
                        <div className="text-right">
                            <span className="block text-5xl text-agent-blue/80 uppercase font-mono tracking-widest mb-1 font-bold">Defense</span>
                            <span className={`text-7xl font-black leading-none tracking-tighter drop-shadow-lg ${character.activeTurn ? 'text-white drop-shadow-[0_0_15px_rgba(43,43,238,0.8)]' : 'text-neutral-300'}`}>{character.armorClass}</span>
                        </div>
                    </div>

                    <h2 className={`text-6xl lg:text-7xl font-black italic tracking-tighter uppercase mb-2 leading-none break-words text-balance drop-shadow-xl ${character.activeTurn ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-neutral-300'}`}>
                        {character.name}
                    </h2>
                    <p className="text-agent-blue text-5xl font-mono font-bold uppercase tracking-widest mb-10 opacity-90 truncate drop-shadow-md">
                        {character.race} // {character.class}
                    </p>
                </div>

                <div className="mt-8">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-5xl text-neutral-300 uppercase font-black tracking-[0.2em]">Vitality</span>
                        <div className="text-right flex items-baseline justify-end gap-3">
                            <span className={`text-9xl font-black italic tracking-tighter leading-none ${character.hp <= 0 ? 'text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'text-white'}`}>
                                {displayHp}
                            </span>
                            <span className="text-5xl text-neutral-300 font-bold">/ {character.maxHp}</span>
                        </div>
                    </div>

                    {/* Technical Health Bar */}
                    <div className="h-32 bg-black/80 rounded-sm overflow-hidden p-1 border border-white/10 relative shadow-inner">
                         {/* Tick Marks - Enhanced */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_9%,rgba(255,255,255,0.1)_10%)] z-20 pointer-events-none" />

                        <div
                            className={`h-full transition-all duration-1000 ease-out relative overflow-hidden backdrop-blur-md ${
                                character.hp <= character.maxHp * 0.2
                                    ? 'bg-red-600/90 shadow-[0_0_40px_rgba(220,38,38,0.8)]'
                                    : character.hp <= character.maxHp * 0.5
                                        ? 'bg-yellow-500/90 shadow-[0_0_40px_rgba(234,179,8,0.8)]'
                                        : 'bg-agent-blue/90 shadow-[0_0_40px_rgba(43,43,238,0.6)]'
                                }`}
                            style={{ width: `${hpPercent}%`, clipPath: 'polygon(0 0, 100% 0, 98% 100%, 0% 100%)' }}
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:40px_40px] animate-[pulse_2s_infinite]" />
                        </div>
                    </div>

                    {/* Conditions */}
                    {conditions.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2 justify-end">
                            {conditions.map((condition, idx) => (
                                <Badge key={idx} variant="destructive" className="font-black uppercase tracking-widest text-5xl !text-5xl !px-6 !py-3 animate-pulse border border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.5)] bg-red-950/80">
                                    {condition}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
