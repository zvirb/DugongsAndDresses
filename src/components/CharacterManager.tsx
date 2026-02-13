'use client';

import { useState } from 'react';
import { createCharacter, updateCharacter, deleteCharacter, addInventoryItem, removeInventoryItem, getAvailableCharacters, importCharacterFromLibrary, duplicateCharacter } from '@/app/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import HPControls from '@/components/HPControls';
import AvatarSelector from '@/components/AvatarSelector';
import ConditionManager from '@/components/ConditionManager';
import { parseAttributes, parseConditions, parseInventory } from '@/lib/safe-json';
import { cn } from '@/lib/utils';
import { Character } from "@/types";

interface CharacterManagerProps {
    characters: Character[];
    campaignId: string;
}

const inputClass = "bg-black/50 border-white/10 text-white focus-visible:ring-agent-blue focus:border-agent-blue h-7 text-xs font-mono";
const selectClass = "flex h-7 w-full rounded-md border border-white/10 bg-black/50 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-agent-blue font-mono";

export default function CharacterManager({ characters, campaignId }: CharacterManagerProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [openAvatarId, setOpenAvatarId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [inventoryInput, setInventoryInput] = useState<Record<string, string>>({});
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [libraryList, setLibraryList] = useState<any[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);

    const openLibrary = async () => {
        setShowLibraryModal(true);
        setLoadingLibrary(true);
        try {
            const result = await getAvailableCharacters();
            if (result.success && Array.isArray(result.data)) {
                setLibraryList(result.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingLibrary(false);
        }
    };

    const handleImport = async (charId: string) => {
        setLoadingLibrary(true); // Indicate busy
        try {
            await importCharacterFromLibrary(campaignId, charId);
            setShowLibraryModal(false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingLibrary(false);
        }
    };

    const handleOpenChange = (id: string, isOpen: boolean) => {
        if (isOpen) setOpenAvatarId(id);
        else if (openAvatarId === id) setOpenAvatarId(null);
    };

    const handleDelete = async (id: string) => {
        await deleteCharacter(id);
        setConfirmDeleteId(null);
    };

    const handleDuplicate = async (id: string) => {
        await duplicateCharacter(id);
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
                            "bg-black/20 border-l-4 transition-all duration-200 backdrop-blur-sm",
                            isOpen
                                ? "z-50 relative border-agent-blue bg-agent-navy/60 shadow-[0_0_20px_rgba(43,43,238,0.2)]"
                                : "z-0 relative border-white/10 hover:border-white/30 hover:bg-agent-blue/5"
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
                                        <span className="font-bold text-white uppercase tracking-wider text-sm">{char.name}</span>
                                        <div className="flex items-center gap-1">
                                            <Badge variant={isNpc ? 'npc' : 'player'} className="text-[10px] px-1 py-0.5">{char.type}</Badge>
                                            <button onClick={() => handleDuplicate(char.id)} className="text-xs text-neutral-500 hover:text-white transition-colors ml-1" title="Duplicate">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                            </button>
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
                                    <div className="mt-2 border-t border-white/10 pt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-agent-blue/70 uppercase font-bold tracking-widest">Inventory</span>
                                        </div>
                                        {inventory.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {inventory.map((item, i) => (
                                                    <button key={i} onClick={() => removeInventoryItem(char.id, item)} title={`Remove ${item}`}>
                                                        <Badge variant="outline" className="text-[10px] border-agent-blue/30 text-agent-blue hover:bg-red-900/50 hover:border-red-500 hover:text-red-400 cursor-pointer transition-colors px-2 py-0.5">
                                                            {item}
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
                                                className={inputClass}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(char.id); } }}
                                            />
                                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs border border-white/10 hover:bg-agent-blue/20 hover:text-white hover:border-agent-blue" onClick={() => handleAddItem(char.id)}>+</Button>
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
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)} className="flex-1 bg-agent-blue/20 text-agent-blue border border-agent-blue/50 hover:bg-agent-blue/40">
                        + Create New
                    </Button>
                    <Button variant="outline" size="sm" onClick={openLibrary} className="flex-1 border-white/10 hover:bg-white/5 text-neutral-300">
                        Import Library
                    </Button>
                </div>
            )}

            {/* Library Modal */}
            {showLibraryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <Card variant="agent" className="max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
                        <CardContent className="p-4 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <h3 className="text-lg font-bold text-agent-blue uppercase tracking-widest">Character Library</h3>
                                <button onClick={() => setShowLibraryModal(false)} className="text-neutral-400 hover:text-white">✕</button>
                            </div>

                            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
                                {loadingLibrary && libraryList.length === 0 ? (
                                    <div className="col-span-2 text-center text-neutral-500 py-8">Accessing Archives...</div>
                                ) : libraryList.length === 0 ? (
                                    <div className="col-span-2 text-center text-neutral-500 py-8">No characters in library.</div>
                                ) : (
                                    libraryList.map((char) => (
                                        <div
                                            key={char.id}
                                            onClick={() => handleImport(char.id)}
                                            className="p-3 bg-neutral-900/50 border border-white/5 rounded-lg hover:border-agent-blue hover:bg-agent-blue/10 cursor-pointer transition-all group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-white group-hover:text-agent-blue">{char.name}</span>
                                                <Badge variant={char.type === 'NPC' ? 'npc' : 'player'} className="text-[10px]">{char.type}</Badge>
                                            </div>
                                            <div className="text-xs text-neutral-400 mt-1">
                                                {char.race} {char.class} (Lv{char.level})
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-1 font-mono">
                                                HP: {char.hp}/{char.maxHp} | AC: {char.armorClass}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
        <Card className="bg-agent-navy/90 border-agent-blue/30 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <CardContent className="p-3">
                <form onSubmit={handleSubmit} className="space-y-2">
                    <h4 className="text-sm font-bold text-agent-blue uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-agent-blue rounded-full" />
                        Add Character
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Name *</label>
                            <Input name="name" required className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Type</label>
                            <select name="type" defaultValue="PLAYER" className={selectClass}>
                                <option value="PLAYER">Player</option>
                                <option value="NPC">NPC</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Race</label>
                            <Input name="race" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Class</label>
                            <Input name="class" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Level</label>
                            <Input name="level" type="number" defaultValue={1} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">HP</label>
                            <Input name="hp" type="number" defaultValue={10} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Max HP</label>
                            <Input name="maxHp" type="number" defaultValue={10} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">AC</label>
                            <Input name="armorClass" type="number" defaultValue={10} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Speed</label>
                            <Input name="speed" type="number" defaultValue={30} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Init Bonus</label>
                            <Input name="initiative" type="number" defaultValue={0} className={inputClass} />
                        </div>
                    </div>
                    <h5 className="text-[10px] text-agent-blue/70 font-bold uppercase tracking-widest mt-1">Ability Scores</h5>
                    <div className="grid grid-cols-6 gap-1">
                        {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(attr => (
                            <div key={attr}>
                                <label className="block text-[10px] text-neutral-500 text-center uppercase tracking-wider">{attr}</label>
                                <Input name={attr} type="number" defaultValue={10} className={`${inputClass} text-center`} />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1 hover:bg-white/5 hover:text-white uppercase tracking-wider text-[10px] font-bold">Cancel</Button>
                        <Button type="submit" size="sm" disabled={submitting} className="flex-1 bg-agent-blue text-white hover:bg-blue-600 uppercase tracking-wider text-[10px] font-bold shadow-[0_0_15px_rgba(43,43,238,0.4)]">{submitting ? 'Adding...' : 'Add'}</Button>
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
        <form onSubmit={handleSubmit} className="space-y-2 bg-agent-navy/40 p-2 rounded border border-agent-blue/20">
            <h4 className="text-sm font-bold text-agent-blue uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-agent-blue rounded-full animate-pulse" />
                Edit Data
            </h4>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Name</label>
                    <Input name="name" defaultValue={character.name} className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Type</label>
                    <select name="type" defaultValue={character.type} className={selectClass}>
                        <option value="PLAYER">Player</option>
                        <option value="NPC">NPC</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Race</label>
                    <Input name="race" defaultValue={character.race || ''} className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Class</label>
                    <Input name="class" defaultValue={character.class || ''} className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Level</label>
                    <Input name="level" type="number" defaultValue={character.level} className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">HP</label>
                    <Input name="hp" type="number" defaultValue={character.hp} className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Max HP</label>
                    <Input name="maxHp" type="number" defaultValue={character.maxHp} className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">AC</label>
                    <Input name="armorClass" type="number" defaultValue={character.armorClass} className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Speed</label>
                    <Input name="speed" type="number" defaultValue={character.speed} className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-agent-blue/70 mb-0.5 uppercase tracking-widest font-bold">Init Bonus</label>
                    <Input name="initiative" type="number" defaultValue={character.initiative} className={inputClass} />
                </div>
            </div>
            <h5 className="text-[10px] text-agent-blue/70 font-bold uppercase tracking-widest mt-1">Ability Scores</h5>
            <div className="grid grid-cols-6 gap-1">
                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(attr => (
                    <div key={attr}>
                        <label className="block text-[10px] text-neutral-500 text-center uppercase tracking-wider">{attr}</label>
                        <Input name={attr} type="number" defaultValue={attrs[attr] || 10} className={`${inputClass} text-center`} />
                    </div>
                ))}
            </div>
            <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1 hover:bg-white/5 hover:text-white uppercase tracking-wider text-[10px] font-bold">Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting} className="flex-1 bg-agent-blue text-white hover:bg-blue-600 uppercase tracking-wider text-[10px] font-bold shadow-[0_0_15px_rgba(43,43,238,0.4)]">{submitting ? 'Saving...' : 'Save'}</Button>
            </div>
        </form>
    );
}
