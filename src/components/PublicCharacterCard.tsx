'use client';

import { useEffect, useState, useRef } from 'react';
import { Badge } from "@/components/ui/Badge";

interface PublicCharacterCardProps {
    character: {
        id: string;
        activeTurn: boolean;
        imageUrl: string | null;
        level: number;
        armorClass: number;
        name: string;
        race: string;
        class: string;
        hp: number;
        maxHp: number;
    };
}

export function PublicCharacterCard({ character }: PublicCharacterCardProps) {
    const [displayHp, setDisplayHp] = useState(character.hp);
    const animationFrameRef = useRef<number>();
    const startTimeRef = useRef<number>();
    const startValueRef = useRef<number>(character.hp);

    useEffect(() => {
        // If HP hasn't changed, ensure display matches (e.g. initial load or re-sync)
        if (displayHp === character.hp) return;

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
                relative overflow-hidden rounded-3xl border-4 transition-all duration-700 backdrop-blur-xl
                ${character.activeTurn
                    ? 'border-agent-blue shadow-[0_0_80px_rgba(43,43,238,0.6)] bg-agent-navy/90 scale-105 z-20 ring-4 ring-agent-blue/50'
                    : 'border-white/5 bg-white/5 grayscale-[0.2] hover:grayscale-0 hover:border-white/10'}
            `}
        >
            {/* Active Turn Scanner Effect */}
            {character.activeTurn && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-2 bg-agent-blue shadow-[0_0_25px_#2b2bee] animate-scan" />
                    <div className="absolute inset-0 border-4 border-agent-blue/50 rounded-3xl animate-pulse" />
                </div>
            )}

            <div className="relative z-10 p-6 flex flex-col h-full min-h-[500px]"> {/* Increased min-height */}
                {/* Portrait Background */}
                {character.imageUrl && (
                    <div className="absolute inset-0 z-[-1] opacity-40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={character.imageUrl} alt="" className="w-full h-full object-cover grayscale" />
                        <div className="absolute inset-0 bg-gradient-to-t from-agent-navy via-agent-navy/50 to-transparent" />
                    </div>
                )}

                <div className="mb-auto">
                    <div className="flex justify-between items-start mb-6"> {/* Increased margin */}
                        <Badge variant={character.activeTurn ? 'agent' : 'player'} className="font-black italic text-3xl px-4 py-2"> {/* Increased text/padding */}
                            LVL {character.level}
                        </Badge>
                        <div className="text-right">
                            <span className="block text-2xl text-neutral-400 uppercase font-black tracking-widest mb-2">Defense</span> {/* Increased text */}
                            <span className={`text-7xl font-black leading-none ${character.activeTurn ? 'text-agent-blue' : 'text-white'}`}>{character.armorClass}</span> {/* Increased text */}
                        </div>
                    </div>

                    <h2 className={`text-5xl lg:text-6xl font-black italic tracking-tighter uppercase mb-4 leading-none break-words ${character.activeTurn ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-neutral-300'}`}> {/* Increased text */}
                        {character.name}
                    </h2>
                    <p className="text-agent-blue text-2xl lg:text-3xl font-bold uppercase tracking-widest mb-10"> {/* Increased text/margin */}
                        {character.race} {"//"} {character.class}
                    </p>
                </div>

                <div className="mt-8">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-2xl text-neutral-400 uppercase font-black tracking-[0.2em]">Vitality</span> {/* Increased text */}
                        <div className="text-right flex items-baseline justify-end">
                            <span className={`text-8xl font-black italic tracking-tighter leading-none ${character.hp <= 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}> {/* Increased text */}
                                {displayHp}
                            </span>
                            <span className="text-4xl text-neutral-500 font-bold ml-4">/ {character.maxHp}</span> {/* Increased text/margin */}
                        </div>
                    </div>

                    {/* Health Bar */}
                    <div className="h-8 bg-white/5 rounded-full overflow-hidden p-1 border-2 border-white/10 shadow-inner"> {/* Increased height */}
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#000_4px,#000_5px)] ${character.hp <= character.maxHp * 0.2 ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]' : 'bg-agent-blue shadow-[0_0_20px_rgba(43,43,238,0.4)]'
                                }`}
                            style={{ width: `${hpPercent}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
