'use client';

import { useState } from 'react';
import { createCampaign, getAvailableCharacters } from '@/app/actions';
import { parseAttributes, createDefaultAttributes, ATTRIBUTE_KEYS, stringifyCharacterInputs } from '@/lib/safe-json';
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

const inputClass = "bg-black/50 border-white/10 text-white focus-visible:ring-agent-blue focus:border-agent-blue h-9 text-sm font-mono transition-all focus:bg-black/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] backdrop-blur-sm";
const selectClass = "flex h-9 w-full rounded-md border border-white/10 bg-black/50 px-3 py-1 text-sm text-agent-blue focus:outline-none focus:ring-1 focus:ring-agent-blue placeholder:text-agent-blue/40 font-mono transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] backdrop-blur-sm appearance-none";

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
        formData.set('characters', stringifyCharacterInputs(characters.map(c => ({
            name: c.name, type: c.type, race: c.race || null, class: c.class || null,
            level: c.level, hp: c.hp, maxHp: c.maxHp, armorClass: c.armorClass,
            speed: c.speed, initiative: c.initiative,
            attributes: c.attributes,
            sourceId: c.sourceId
        }))));
        await createCampaign(formData);
        setSubmitting(false);
    };

    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-agent-navy text-white relative overflow-hidden selection:bg-agent-blue/30 selection:text-white">
            {/* Background elements for technical feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent_0%,transparent_50%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.2)_100%)] bg-[length:100%_4px] opacity-40 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2bee10_1px,transparent_1px),linear-gradient(to_bottom,#2b2bee10_1px,transparent_1px)] [background-size:40px_40px] opacity-20 animate-[pulse_4s_infinite]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#101022_90%)] opacity-90" />
                <div className="absolute top-0 left-0 w-full h-1 bg-agent-blue shadow-[0_0_20px_#2b2bee] animate-scan" />
            </div>

            {/* Library Modal */}
            {libraryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card variant="agent" className="max-w-2xl w-full max-h-[80vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] border-agent-blue/60">
                         {/* Scanline Overlay */}
                        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20" />

                        <CardHeader className="flex flex-row items-center justify-between border-b border-agent-blue/20 bg-agent-navy/95 relative z-10 py-4">
                            <CardTitle className="text-lg font-black text-agent-blue uppercase tracking-widest flex items-center gap-3">
                                <span className="w-2 h-2 bg-agent-blue rounded-full animate-pulse shadow-[0_0_10px_#2b2bee]" />
                                Character Archives
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setLibraryOpen(false)} className="text-agent-blue/60 hover:text-white uppercase tracking-wider text-xs font-bold">Close</Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 bg-black/40 relative z-10 scrollbar-thin scrollbar-thumb-agent-blue/30 scrollbar-track-transparent">
                            {libraryLoading ? (
                                <p className="text-agent-blue/50 text-center py-8 font-mono animate-pulse uppercase tracking-widest">Accessing Secure Database...</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {libraryList.map((char) => (
                                        <div key={char.id}
                                            onClick={() => selectFromLibrary(char)}
                                            className="p-3 bg-black/60 rounded-lg border border-white/10 hover:border-agent-blue hover:bg-agent-blue/10 cursor-pointer transition-all duration-200 group relative overflow-hidden"
                                        >
                                            <div className="relative z-10">
                                                <div className="font-bold text-white group-hover:text-agent-blue uppercase tracking-wider">{char.name}</div>
                                                <div className="text-xs text-agent-blue/60 font-mono mt-1">
                                                    {char.race} {char.class} (Lv{char.level})
                                                </div>
                                                <div className="text-xs text-agent-blue/70 mt-1 font-mono uppercase tracking-tight">
                                                    HP: {char.hp}/{char.maxHp} | AC: {char.armorClass}
                                                </div>
                                            </div>
                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-agent-blue border border-agent-blue px-1 rounded bg-black/50 backdrop-blur-sm">IMPORT</span>
                                            </div>
                                        </div>
                                    ))}
                                    {libraryList.length === 0 && <p className="text-agent-blue/40 font-mono text-center col-span-2 py-8">No records found in archive.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in duration-500">
                <div className="text-agent-blue font-mono text-xs animate-pulse mb-2 tracking-[0.3em] uppercase text-center flex items-center justify-center gap-3 opacity-80">
                    <span className="w-1.5 h-1.5 bg-agent-blue rounded-full shadow-[0_0_5px_#2b2bee]" />
                    System Initialization
                    <span className="w-1.5 h-1.5 bg-agent-blue rounded-full shadow-[0_0_5px_#2b2bee]" />
                </div>

                <Card variant="agent" className="w-full border-t-4 border-t-agent-blue shadow-[0_0_40px_rgba(43,43,238,0.2)]">
                    <CardHeader className="border-b border-agent-blue/20 bg-agent-navy/80 pb-6 pt-8">
                        <CardTitle className="text-4xl font-black italic text-white uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] mb-2">
                            Campaign <span className="text-agent-blue drop-shadow-[0_0_15px_rgba(43,43,238,0.6)]">Wizard</span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="h-1 flex-1 bg-black/50 rounded-full overflow-hidden">
                                <div className={`h-full bg-agent-blue shadow-[0_0_10px_#2b2bee] transition-all duration-500 ease-out`} style={{ width: `${(step / 3) * 100}%` }} />
                            </div>
                            <p className="text-agent-blue font-mono text-xs font-bold uppercase tracking-widest whitespace-nowrap">Step {step} // 03</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-black/20 backdrop-blur-md min-h-[400px]">
                        {step === 1 && (
                            <div className="space-y-6 py-8 animate-in slide-in-from-right-8 duration-300">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-agent-blue uppercase tracking-[0.2em] ml-1">Project Codename</label>
                                    <Input
                                        value={campaignName}
                                        onChange={(e) => setCampaignName(e.target.value)}
                                        placeholder="e.g. OPERATION BLACKSTONE"
                                        className="h-16 text-xl px-4 bg-black/50 border-agent-blue/30 focus:border-agent-blue focus:bg-black/70 font-mono tracking-wider shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] placeholder:text-agent-blue/20"
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-agent-blue/40 font-mono ml-1 uppercase tracking-wider">Define the operation identifier.</p>
                                </div>
                                <div className="pt-4">
                                    <Button
                                        onClick={() => setStep(2)}
                                        disabled={!campaignName.trim()}
                                        variant="agent"
                                        size="lg"
                                        className="w-full h-14 text-lg shadow-[0_0_25px_rgba(43,43,238,0.3)] hover:shadow-[0_0_35px_rgba(43,43,238,0.6)] transition-all"
                                    >
                                        Initialize Protocol &gt;
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Combatant Manifest</h4>
                                        <p className="text-[10px] text-agent-blue/40 font-mono mt-0.5">Register initial personnel.</p>
                                    </div>
                                    <span className="text-xs font-mono text-agent-blue font-bold bg-agent-blue/10 px-2 py-0.5 rounded border border-agent-blue/30">
                                        COUNT: {characters.length.toString().padStart(2, '0')}
                                    </span>
                                </div>

                                {characters.length > 0 && (
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                        {characters.map((c, i) => (
                                            <div key={i} className="flex items-center justify-between bg-black/40 rounded-lg p-2 border border-white/5 hover:border-agent-blue/30 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-8 bg-agent-blue/50 rounded-full" />
                                                    <div>
                                                        <span className="font-bold text-white uppercase tracking-wide text-sm block">{c.name}</span>
                                                        <span className="text-agent-blue/40 text-[10px] font-mono uppercase tracking-wider">
                                                            {c.race} {c.class} Lv{c.level}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeCharacter(i)} className="text-agent-blue/40 hover:text-red-400 h-6 px-2 text-[10px] uppercase tracking-wider hover:bg-white/5">
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="bg-agent-navy/40 border border-agent-blue/20 rounded-lg p-4 space-y-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-agent-blue uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-agent-blue rounded-full animate-pulse" />
                                            New Entry
                                        </h4>
                                        <Button variant="outline" size="sm" onClick={loadLibrary} className="h-7 text-[10px] border-agent-blue/30 text-agent-blue hover:text-white hover:bg-agent-blue/20 hover:border-agent-blue transition-all shadow-[0_0_10px_rgba(43,43,238,0.1)]">
                                            Load From Archives
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-[10px] text-agent-blue/60 mb-1 uppercase tracking-wider font-bold">Name *</label>
                                            <Input value={current.name} onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="e.g. Sgt. Stone" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-[10px] text-agent-blue/60 mb-1 uppercase tracking-wider font-bold">Type</label>
                                            <div className="relative">
                                                <select
                                                    value={current.type}
                                                    onChange={e => setCurrent(p => ({ ...p, type: e.target.value }))}
                                                    className={selectClass}
                                                >
                                                    <option value="PLAYER">Player Asset</option>
                                                    <option value="NPC">NPC / Hostile</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-agent-blue">
                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-agent-blue/60 mb-1 uppercase tracking-wider font-bold">Race</label>
                                            <Input value={current.race} onChange={e => setCurrent(p => ({ ...p, race: e.target.value }))} className={inputClass} placeholder="Human" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-agent-blue/60 mb-1 uppercase tracking-wider font-bold">Class</label>
                                            <Input value={current.class} onChange={e => setCurrent(p => ({ ...p, class: e.target.value }))} className={inputClass} placeholder="Fighter" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 col-span-2">
                                            <div>
                                                <label className="block text-[10px] text-agent-blue/60 mb-1 uppercase tracking-wider font-bold text-center">Lvl</label>
                                                <Input type="number" value={current.level} onChange={e => setCurrent(p => ({ ...p, level: parseInt(e.target.value) || 1 }))} className={`${inputClass} text-center`} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-agent-blue/60 mb-1 uppercase tracking-wider font-bold text-center">HP</label>
                                                <Input type="number" value={current.hp} onChange={e => { const v = parseInt(e.target.value) || 1; setCurrent(p => ({ ...p, hp: v, maxHp: v })); }} className={`${inputClass} text-center`} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-agent-blue/60 mb-1 uppercase tracking-wider font-bold text-center">AC</label>
                                                <Input type="number" value={current.armorClass} onChange={e => setCurrent(p => ({ ...p, armorClass: parseInt(e.target.value) || 10 }))} className={`${inputClass} text-center`} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 col-span-2">
                                            <div>
                                                <label className="block text-[10px] text-agent-blue/60 mb-1 uppercase tracking-wider font-bold text-center">Speed</label>
                                                <Input type="number" value={current.speed} onChange={e => setCurrent(p => ({ ...p, speed: parseInt(e.target.value) || 30 }))} className={`${inputClass} text-center`} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-agent-blue/60 mb-1 uppercase tracking-wider font-bold text-center">Init Bonus</label>
                                                <Input type="number" value={current.initiative} onChange={e => setCurrent(p => ({ ...p, initiative: parseInt(e.target.value) || 0 }))} className={`${inputClass} text-center`} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/5 pt-2 mt-2">
                                        <h5 className="text-[10px] font-bold text-agent-blue/70 uppercase tracking-widest mb-2 text-center">Core Attributes</h5>
                                        <div className="grid grid-cols-6 gap-1">
                                            {ATTRIBUTE_KEYS.map(attr => (
                                                <div key={attr}>
                                                    <label className="block text-[9px] text-agent-blue/60 text-center uppercase tracking-wider mb-0.5">{attr}</label>
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
                                                        className={`${inputClass} text-center px-0 h-8 text-xs`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button onClick={addCharacter} disabled={!current.name.trim()} className="w-full h-10 shadow-[0_0_15px_rgba(43,43,238,0.2)]" variant="agent">
                                        Add to Manifest +
                                    </Button>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 border border-white/10 hover:bg-white/5 hover:text-white uppercase tracking-wider font-bold text-xs h-10">
                                        &lt; Back
                                    </Button>
                                    <Button onClick={handleNextStep} className="flex-1 h-10 border border-agent-blue/50" variant="outline">
                                        Review Manifest &gt;
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                                <div className="space-y-4">
                                    <div className="bg-black/40 rounded-lg p-4 border-l-4 border-agent-blue shadow-[0_0_20px_rgba(43,43,238,0.1)]">
                                        <h4 className="text-[10px] text-agent-blue font-mono uppercase tracking-widest mb-1">Campaign Identifier</h4>
                                        <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{campaignName}</p>
                                    </div>

                                    <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                                        <h4 className="text-[10px] text-agent-blue/40 font-mono uppercase tracking-widest mb-3 border-b border-white/5 pb-1">Personnel ({characters.length})</h4>
                                        {characters.length === 0 ? (
                                            <p className="text-agent-blue/40 text-xs italic p-4 text-center border border-dashed border-white/10 rounded">No personnel assigned. Reinforcements can be deployed later.</p>
                                        ) : (
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                                {characters.map((c, i) => (
                                                    <div key={i} className="text-sm flex justify-between items-center p-2 hover:bg-white/5 rounded transition-colors border-b border-white/5 last:border-0">
                                                        <span className="font-bold text-white uppercase tracking-wide">{c.name}</span>
                                                        <span className="text-agent-blue/60 text-xs font-mono">
                                                            Lv{c.level} {c.class}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 border border-white/10 hover:bg-white/5 hover:text-white uppercase tracking-wider font-bold text-xs h-12">
                                        &lt; Back
                                    </Button>
                                    <Button onClick={handleCreate} disabled={submitting} variant="agent" size="lg" className="flex-1 h-12 shadow-[0_0_30px_rgba(43,43,238,0.4)] hover:shadow-[0_0_40px_rgba(43,43,238,0.6)] animate-pulse hover:animate-none transition-all">
                                        {submitting ? 'INITIALIZING...' : 'EXECUTE LAUNCH'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
