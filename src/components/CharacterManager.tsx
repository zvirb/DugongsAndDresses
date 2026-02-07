'use client';

import { useState } from 'react';
import { createCharacter, updateCharacter, deleteCharacter, addInventoryItem, removeInventoryItem } from '@/app/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import HPControls from '@/components/HPControls';
import AvatarSelector from '@/components/AvatarSelector';
import ConditionManager from '@/components/ConditionManager';
import { parseAttributes, parseConditions, parseInventory } from '@/lib/safe-json';
import { cn } from '@/lib/utils';

interface Character {
    id: string;
    name: string;
    type: string;
    race: string | null;
    class: string | null;
    level: number;
    hp: number;
    maxHp: number;
    armorClass: number;
    speed: number;
    initiative: number;
    imageUrl: string | null;
    conditions: string;
    attributes: string;
    inventory: string;
}

interface CharacterManagerProps {
    characters: Character[];
    campaignId: string;
}

export default function CharacterManager({ characters, campaignId }: CharacterManagerProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [openAvatarId, setOpenAvatarId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [inventoryInput, setInventoryInput] = useState<Record<string, string>>({});

    const handleOpenChange = (id: string, isOpen: boolean) => {
        if (isOpen) setOpenAvatarId(id);
        else if (openAvatarId === id) setOpenAvatarId(null);
    };

    const handleDelete = async (id: string) => {
        await deleteCharacter(id);
        setConfirmDeleteId(null);
    };

    const handleAddItem = async (charId: string) => {
        const item = inventoryInput[charId]?.trim();
        if (!item) return;
        await addInventoryItem(charId, item);
        setInventoryInput(prev => ({ ...prev, [charId]: '' }));
    };

    return (
        <div className="space-y-4">
            {characters.map((char) => {
                const isNpc = char.type === 'NPC';
                const isOpen = openAvatarId === char.id;
                const attrs = parseAttributes(char.attributes);
                const conditions = parseConditions(char.conditions);
                const inventory = parseInventory(char.inventory);
                const isEditing = editingId === char.id;

                return (
                    <Card
                        key={char.id}
                        className={cn(
                            "bg-agent-navy/50 border-agent-blue/20 transition-all duration-200",
                            isOpen ? "z-50 relative border-agent-blue shadow-lg shadow-agent-blue/20" : "z-0 relative"
                        )}
                    >
                        <CardContent className="p-3">
                            {isEditing ? (
                                <EditCharacterForm
                                    character={char}
                                    attrs={attrs}
                                    onClose={() => setEditingId(null)}
                                />
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-white">{char.name}</span>
                                        <div className="flex items-center gap-1">
                                            <Badge variant={isNpc ? 'npc' : 'player'}>{char.type}</Badge>
                                            <button onClick={() => setEditingId(char.id)} className="text-xs text-neutral-500 hover:text-agent-blue transition-colors ml-1" title="Edit">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                            </button>
                                            {confirmDeleteId === char.id ? (
                                                <div className="flex items-center gap-1 ml-1">
                                                    <button onClick={() => handleDelete(char.id)} className="text-[10px] text-red-400 hover:text-red-300">Confirm</button>
                                                    <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-neutral-500 hover:text-neutral-300">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmDeleteId(char.id)} className="text-xs text-neutral-500 hover:text-red-400 transition-colors ml-1" title="Delete">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {char.race && (
                                        <p className="text-xs text-neutral-400 mb-2">{char.race} {char.class} Lv{char.level}</p>
                                    )}
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
                                        </div>
                                    </div>

                                    {/* Ability Scores */}
                                    {Object.keys(attrs).length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {Object.entries(attrs).map(([key, val]) => (
                                                <span key={key} className="text-[10px] text-neutral-400 uppercase">
                                                    <span className="font-bold text-neutral-300">{key}</span> {val}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Conditions */}
                                    <div className="mt-2">
                                        <ConditionManager characterId={char.id} conditions={conditions} />
                                    </div>

                                    {/* Inventory */}
                                    <div className="mt-2 border-t border-neutral-800 pt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Inventory</span>
                                        </div>
                                        {inventory.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-1">
                                                {inventory.map((item, i) => (
                                                    <button key={i} onClick={() => removeInventoryItem(char.id, item)} title={`Remove ${item}`}>
                                                        <Badge variant="outline" className="text-[10px] hover:opacity-70 cursor-pointer">
                                                            {item} &times;
                                                        </Badge>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-1">
                                            <Input
                                                value={inventoryInput[char.id] || ''}
                                                onChange={e => setInventoryInput(prev => ({ ...prev, [char.id]: e.target.value }))}
                                                placeholder="Add item..."
                                                className="bg-neutral-950 border-neutral-700 h-7 text-xs"
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(char.id); } }}
                                            />
                                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleAddItem(char.id)}>+</Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            {showAddForm ? (
                <AddCharacterForm campaignId={campaignId} onClose={() => setShowAddForm(false)} />
            ) : (
                <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)} className="w-full">
                    + Add Character
                </Button>
            )}
        </div>
    );
}

function AddCharacterForm({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        formData.set('campaignId', campaignId);
        await createCharacter(formData);
        setSubmitting(false);
        onClose();
    };

    return (
        <Card className="bg-neutral-900 border-agent-blue/30">
            <CardContent className="p-3">
                <form onSubmit={handleSubmit} className="space-y-2">
                    <h4 className="text-sm font-semibold text-agent-blue">Add Character</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] text-neutral-400 mb-0.5">Name *</label>
                            <Input name="name" required className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-neutral-400 mb-0.5">Type</label>
                            <select name="type" defaultValue="PLAYER" className="flex h-7 w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100">
                                <option value="PLAYER">Player</option>
                                <option value="NPC">NPC</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-neutral-400 mb-0.5">Race</label>
                            <Input name="race" className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-neutral-400 mb-0.5">Class</label>
                            <Input name="class" className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-neutral-400 mb-0.5">Level</label>
                            <Input name="level" type="number" defaultValue={1} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-neutral-400 mb-0.5">HP</label>
                            <Input name="hp" type="number" defaultValue={10} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-neutral-400 mb-0.5">Max HP</label>
                            <Input name="maxHp" type="number" defaultValue={10} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-neutral-400 mb-0.5">AC</label>
                            <Input name="armorClass" type="number" defaultValue={10} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-neutral-400 mb-0.5">Speed</label>
                            <Input name="speed" type="number" defaultValue={30} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-neutral-400 mb-0.5">Init Bonus</label>
                            <Input name="initiative" type="number" defaultValue={0} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                        </div>
                    </div>
                    <h5 className="text-[10px] text-neutral-400 font-bold uppercase mt-1">Ability Scores</h5>
                    <div className="grid grid-cols-6 gap-1">
                        {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(attr => (
                            <div key={attr}>
                                <label className="block text-[10px] text-neutral-500 text-center uppercase">{attr}</label>
                                <Input name={attr} type="number" defaultValue={10} className="bg-neutral-950 border-neutral-700 h-7 text-xs text-center" />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" size="sm" disabled={submitting} className="flex-1">{submitting ? 'Adding...' : 'Add'}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function EditCharacterForm({ character, attrs, onClose }: { character: Character; attrs: Record<string, number>; onClose: () => void }) {
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        await updateCharacter(character.id, formData);
        setSubmitting(false);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <h4 className="text-sm font-semibold text-agent-blue">Edit Character</h4>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Name</label>
                    <Input name="name" defaultValue={character.name} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Type</label>
                    <select name="type" defaultValue={character.type} className="flex h-7 w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100">
                        <option value="PLAYER">Player</option>
                        <option value="NPC">NPC</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Race</label>
                    <Input name="race" defaultValue={character.race || ''} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Class</label>
                    <Input name="class" defaultValue={character.class || ''} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Level</label>
                    <Input name="level" type="number" defaultValue={character.level} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">HP</label>
                    <Input name="hp" type="number" defaultValue={character.hp} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Max HP</label>
                    <Input name="maxHp" type="number" defaultValue={character.maxHp} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">AC</label>
                    <Input name="armorClass" type="number" defaultValue={character.armorClass} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Speed</label>
                    <Input name="speed" type="number" defaultValue={character.speed} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Init Bonus</label>
                    <Input name="initiative" type="number" defaultValue={character.initiative} className="bg-neutral-950 border-neutral-700 h-7 text-xs" />
                </div>
            </div>
            <h5 className="text-[10px] text-neutral-400 font-bold uppercase mt-1">Ability Scores</h5>
            <div className="grid grid-cols-6 gap-1">
                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(attr => (
                    <div key={attr}>
                        <label className="block text-[10px] text-neutral-500 text-center uppercase">{attr}</label>
                        <Input name={attr} type="number" defaultValue={attrs[attr] || 10} className="bg-neutral-950 border-neutral-700 h-7 text-xs text-center" />
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting} className="flex-1">{submitting ? 'Saving...' : 'Save'}</Button>
            </div>
        </form>
    );
}
