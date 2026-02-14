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
                relative overflow-hidden rounded-3xl border-4 transition-all duration-500 backdrop-blur-xl group
                ${character.activeTurn
                    ? 'border-agent-blue shadow-[0_0_100px_rgba(43,43,238,0.6),inset_0_0_30px_rgba(43,43,238,0.2)] bg-agent-navy/90 scale-105 z-30 ring-4 ring-agent-blue/30'
                    : 'border-white/5 bg-white/5 grayscale-[0.8] hover:grayscale-0 hover:border-white/20 hover:bg-black/40'}
            `}
        >
            {/* Flash Overlay */}
            <div className={`absolute inset-0 pointer-events-none z-50 transition-opacity duration-500 ${flashState === 'damage' ? 'bg-red-600/40 opacity-100' : flashState === 'heal' ? 'bg-green-500/40 opacity-100' : 'opacity-0'}`} />

            {/* Active Turn Scanner Effect */}
            {character.activeTurn && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-1 bg-agent-blue shadow-[0_0_30px_#2b2bee] animate-scan" />
                    <div className="absolute inset-0 border-4 border-agent-blue/20 rounded-3xl" />
                </div>
            )}

            <div className="relative z-10 p-6 flex flex-col h-full min-h-[500px]">
                {/* Portrait Background */}
                {character.imageUrl && (
                    <div className="absolute inset-0 z-[-1] opacity-30 mix-blend-overlay group-hover:opacity-50 transition-opacity duration-500">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={character.imageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-agent-navy via-agent-navy/80 to-transparent" />
                    </div>
                )}

                <div className="mb-auto">
                    <div className="flex justify-between items-start mb-6">
                        <Badge variant={character.activeTurn ? 'agent' : 'player'} className="font-black italic text-3xl px-4 py-2 uppercase tracking-widest shadow-lg">
                            LVL {character.level}
                        </Badge>
                        <div className="text-right">
                            <span className="block text-xl text-agent-blue/80 uppercase font-mono tracking-widest mb-1">Defense</span>
                            <span className={`text-7xl font-black leading-none tracking-tighter ${character.activeTurn ? 'text-white drop-shadow-[0_0_10px_rgba(43,43,238,0.8)]' : 'text-neutral-400'}`}>{character.armorClass}</span>
                        </div>
                    </div>

                    <h2 className={`text-6xl lg:text-7xl font-black italic tracking-tighter uppercase mb-2 leading-none break-words ${character.activeTurn ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-neutral-300'}`}>
                        {character.name}
                    </h2>
                    <p className="text-agent-blue text-xl font-mono font-bold uppercase tracking-widest mb-10 opacity-80">
                        {character.race} // {character.class}
                    </p>
                </div>

                <div className="mt-8">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-2xl text-neutral-400 uppercase font-black tracking-[0.2em]">Vitality</span>
                        <div className="text-right flex items-baseline justify-end gap-3">
                            <span className={`text-8xl font-black italic tracking-tighter leading-none ${character.hp <= 0 ? 'text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'text-white'}`}>
                                {displayHp}
                            </span>
                            <span className="text-3xl text-neutral-600 font-bold">/ {character.maxHp}</span>
                        </div>
                    </div>

                    {/* Technical Health Bar */}
                    <div className="h-12 bg-black/60 rounded-none overflow-hidden p-1 border border-white/10 relative">
                         {/* Tick Marks */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_19%,#ffffff10_20%)] z-10 pointer-events-none" />

                        <div
                            className={`h-full transition-all duration-1000 ease-out relative overflow-hidden backdrop-blur-sm ${
                                character.hp <= character.maxHp * 0.2
                                    ? 'bg-red-600/90 shadow-[0_0_30px_rgba(220,38,38,0.6)]'
                                    : character.hp <= character.maxHp * 0.5
                                        ? 'bg-yellow-500/90 shadow-[0_0_30px_rgba(234,179,8,0.6)]'
                                        : 'bg-agent-blue/90 shadow-[0_0_30px_rgba(43,43,238,0.4)]'
                                }`}
                            style={{ width: `${hpPercent}%`, clipPath: 'polygon(0 0, 100% 0, 98% 100%, 0% 100%)' }}
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-[pulse_1s_infinite]" />
                        </div>
                    </div>

                    {/* Conditions */}
                    {conditions.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2 justify-end">
                            {conditions.map((condition, idx) => (
                                <Badge key={idx} variant="destructive" className="font-black uppercase tracking-widest text-4xl px-4 py-2 animate-pulse border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
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
