'use client';

import { useState } from 'react';
import { createCampaign, getAvailableCharacters } from '@/app/actions';
import { parseAttributes, createDefaultAttributes, ATTRIBUTE_KEYS } from '@/lib/safe-json';
import { Attributes } from '@/lib/schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CharacterDraft {
    name: string;
    type: string;
    race: string;
    class: string;
    level: number;
    hp: number;
    maxHp: number;
    armorClass: number;
    speed: number;
    initiative: number;
    attributes: Attributes;
    sourceId?: string; // Add sourceId for syncing
}

const defaultCharacter: CharacterDraft = {
    name: '', type: 'PLAYER', race: '', class: '', level: 1,
    hp: 10, maxHp: 10, armorClass: 10, speed: 30, initiative: 0,
    attributes: createDefaultAttributes(),
};

export default function CampaignWizard() {
    const [step, setStep] = useState(1);
    const [campaignName, setCampaignName] = useState('');
    const [characters, setCharacters] = useState<CharacterDraft[]>([]);
    const [current, setCurrent] = useState<CharacterDraft>({ ...defaultCharacter });
    const [submitting, setSubmitting] = useState(false);

    // Library State
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [libraryList, setLibraryList] = useState<any[]>([]);

    const addCharacter = () => {
        if (!current.name.trim()) return;
        setCharacters(prev => [...prev, { ...current }]);
        setCurrent({ ...defaultCharacter });
    };

    const removeCharacter = (idx: number) => {
        setCharacters(prev => prev.filter((_, i) => i !== idx));
    };

    const handleNextStep = () => {
        if (current.name.trim()) {
            addCharacter();
        }
        setStep(3);
    };

    const loadLibrary = async () => {
        setLibraryLoading(true);
        setLibraryOpen(true);
        try {
            const result = await getAvailableCharacters();
            if (result && Array.isArray(result)) {
                setLibraryList(result);
            }
        } catch (e) {
            console.error("Failed to load library", e);
        } finally {
            setLibraryLoading(false);
        }
    };

    const selectFromLibrary = (char: any) => {
        const attrs = parseAttributes(char.attributes);
        setCurrent({
            name: char.name,
            type: char.type,
            race: char.race || '',
            class: char.class || '',
            level: char.level || 1,
            hp: char.hp,
            maxHp: char.maxHp,
            armorClass: char.armorClass,
            speed: char.speed,
            initiative: char.initiative,
            attributes: attrs,
            sourceId: char.id, // Keep the ID for syncing
        });
        setLibraryOpen(false);
    };

    const handleCreate = async () => {
        setSubmitting(true);
        const formData = new FormData();
        formData.set('name', campaignName);
        formData.set('characters', JSON.stringify(characters.map(c => ({
            name: c.name, type: c.type, race: c.race || undefined, class: c.class || undefined,
            level: c.level, hp: c.hp, maxHp: c.maxHp, armorClass: c.armorClass,
            speed: c.speed, initiative: c.initiative,
            attributes: c.attributes,
            sourceId: c.sourceId
        }))));
        await createCampaign(formData);
        setSubmitting(false);
    };

    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-agent-navy text-white relative">
            {/* Library Modal */}
            {libraryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <Card variant="agent" className="max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Character Library</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setLibraryOpen(false)}>Close</Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            {libraryLoading ? (
                                <p className="text-neutral-400">Loading library...</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {libraryList.map((char) => (
                                        <div key={char.id}
                                            onClick={() => selectFromLibrary(char)}
                                            className="p-3 bg-neutral-900 rounded-lg border border-neutral-700 hover:border-agent-blue cursor-pointer transition-colors"
                                        >
                                            <div className="font-bold text-white">{char.name}</div>
                                            <div className="text-xs text-neutral-400">
                                                {char.race} {char.class} (Lv{char.level})
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-1">
                                                HP {char.hp}/{char.maxHp} | AC {char.armorClass}
                                            </div>
                                        </div>
                                    ))}
                                    {libraryList.length === 0 && <p className="text-neutral-500">No saved characters found.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card variant="agent" className="max-w-2xl w-full">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-agent-blue mb-2">Campaign Wizard</CardTitle>
                    <p className="text-neutral-400">Step {step} of 3</p>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <div className="space-y-4">
                            <label className="block text-sm text-neutral-300">Campaign Name</label>
                            <Input
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                placeholder="e.g. The Lost Mine"
                                className="bg-neutral-900 border-neutral-600"
                            />
                            <Button
                                onClick={() => setStep(2)}
                                disabled={!campaignName.trim()}
                                size="lg"
                                className="w-full"
                            >
                                Next: Add Characters
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-neutral-400">Add characters to your campaign. You can also add them later from the DM page.</p>

                            {characters.length > 0 && (
                                <div className="space-y-2">
                                    {characters.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between bg-neutral-900 rounded-lg p-3 border border-neutral-700">
                                            <div>
                                                <span className="font-bold text-white">{c.name}</span>
                                                <span className="text-neutral-400 text-sm ml-2">
                                                    {c.race} {c.class} Lv{c.level} | HP {c.hp}/{c.maxHp} AC {c.armorClass}
                                                </span>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeCharacter(i)} className="text-red-400 hover:text-red-300">
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="border border-neutral-700 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-agent-blue">New Character</h4>
                                    <Button variant="ghost" size="sm" onClick={loadLibrary} className="text-agent-blue hover:text-agent-ice">
                                        Load from Library
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Name *</label>
                                        <Input value={current.name} onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))} className="bg-neutral-900 border-neutral-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Type</label>
                                        <select
                                            value={current.type}
                                            onChange={e => setCurrent(p => ({ ...p, type: e.target.value }))}
                                            className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-sm text-neutral-100"
                                        >
                                            <option value="PLAYER">Player</option>
                                            <option value="NPC">NPC</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Race</label>
                                        <Input value={current.race} onChange={e => setCurrent(p => ({ ...p, race: e.target.value }))} className="bg-neutral-900 border-neutral-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Class</label>
                                        <Input value={current.class} onChange={e => setCurrent(p => ({ ...p, class: e.target.value }))} className="bg-neutral-900 border-neutral-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Level</label>
                                        <Input type="number" value={current.level} onChange={e => setCurrent(p => ({ ...p, level: parseInt(e.target.value) || 1 }))} className="bg-neutral-900 border-neutral-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">HP</label>
                                        <Input type="number" value={current.hp} onChange={e => { const v = parseInt(e.target.value) || 1; setCurrent(p => ({ ...p, hp: v, maxHp: v })); }} className="bg-neutral-900 border-neutral-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">AC</label>
                                        <Input type="number" value={current.armorClass} onChange={e => setCurrent(p => ({ ...p, armorClass: parseInt(e.target.value) || 10 }))} className="bg-neutral-900 border-neutral-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Speed</label>
                                        <Input type="number" value={current.speed} onChange={e => setCurrent(p => ({ ...p, speed: parseInt(e.target.value) || 30 }))} className="bg-neutral-900 border-neutral-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Initiative Bonus</label>
                                        <Input type="number" value={current.initiative} onChange={e => setCurrent(p => ({ ...p, initiative: parseInt(e.target.value) || 0 }))} className="bg-neutral-900 border-neutral-600" />
                                    </div>
                                </div>
                                <h5 className="text-xs font-semibold text-neutral-400 mt-2">Ability Scores</h5>
                                <div className="grid grid-cols-6 gap-2">
                                    {ATTRIBUTE_KEYS.map(attr => (
                                        <div key={attr}>
                                            <label className="block text-xs text-neutral-500 text-center uppercase">{attr}</label>
                                            <Input
                                                type="number"
                                                value={current.attributes[attr]}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 10;
                                                    setCurrent(p => ({
                                                        ...p,
                                                        attributes: { ...p.attributes, [attr]: val }
                                                    }));
                                                }}
                                                className="bg-neutral-900 border-neutral-600 text-center"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={addCharacter} disabled={!current.name.trim()} className="w-full" variant="secondary">
                                    Add Character
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
                                <Button onClick={handleNextStep} className="flex-1">
                                    Next: Review
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                                <h4 className="text-sm text-neutral-400 mb-1">Campaign</h4>
                                <p className="text-xl font-bold text-white">{campaignName}</p>
                            </div>
                            <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                                <h4 className="text-sm text-neutral-400 mb-2">Characters ({characters.length})</h4>
                                {characters.length === 0 ? (
                                    <p className="text-neutral-500 text-sm italic">No characters added. You can add them later from the DM page.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {characters.map((c, i) => (
                                            <div key={i} className="text-sm text-neutral-300">
                                                <span className="font-bold text-white">{c.name}</span> &mdash; {c.race} {c.class} Lv{c.level} | HP {c.hp}/{c.maxHp} AC {c.armorClass}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">Back</Button>
                                <Button onClick={handleCreate} disabled={submitting} size="lg" className="flex-1">
                                    {submitting ? 'Creating...' : 'Begin Campaign'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
