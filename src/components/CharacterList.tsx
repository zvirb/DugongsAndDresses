'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import HPControls from "@/components/HPControls";
import AvatarSelector from "@/components/AvatarSelector";
import { cn } from "@/lib/utils";

interface Character {
    id: string;
    name: string;
    type: string;
    hp: number;
    maxHp: number;
    armorClass: number;
    imageUrl: string | null;
    conditions: string;
    // Add other fields if needed for display, but these are what we use
}

interface CharacterListProps {
    characters: Character[];
}

export default function CharacterList({ characters }: CharacterListProps) {
    const [openAvatarId, setOpenAvatarId] = useState<string | null>(null);

    const handleOpenChange = (id: string, isOpen: boolean) => {
        if (isOpen) {
            setOpenAvatarId(id);
        } else if (openAvatarId === id) {
            setOpenAvatarId(null);
        }
    };

    return (
        <div className="space-y-4">
            {characters.map((char) => {
                const isNpc = char.type === 'NPC';
                const isOpen = openAvatarId === char.id;

                return (
                    <Card
                        key={char.id}
                        className={cn(
                            "bg-agent-navy/50 border-agent-blue/20 transition-all duration-200"
                        )}
                    >
                        <CardContent className="p-3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-white">{char.name}</span>
                                <Badge variant={isNpc ? 'npc' : 'player'}>{char.type}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-neutral-300">
                                <div>
                                    <div className="flex justify-between items-center">
                                        <span>HP</span>
                                        <span className="text-white font-mono">{char.hp}/{char.maxHp}</span>
                                    </div>
                                    <HPControls characterId={char.id} currentHp={char.hp} />
                                </div>
                                <div>
                                    <div className="flex justify-between">
                                        <span>AC</span>
                                        <span className="text-white font-bold">{char.armorClass}</span>
                                    </div>
                                    <AvatarSelector
                                        characterId={char.id}
                                        isOpen={isOpen}
                                        onOpenChange={(open) => handleOpenChange(char.id, open)}
                                    />
                                    <div className="text-xs text-neutral-400 mt-1 truncate">
                                        {char.conditions !== '[]' ? char.conditions : 'Normal'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div >
    );
}
