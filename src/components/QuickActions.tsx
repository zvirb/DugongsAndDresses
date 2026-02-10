'use client';

import { useState } from 'react';
import { logAction, performAttack, performSkillCheck, castSpell } from '@/app/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface CharacterOption {
    id: string;
    name: string;
    type: string;
}

interface QuickActionsProps {
    campaignId: string;
    characters: CharacterOption[];
}

type ActionType = 'attack' | 'skill' | 'spell' | 'note' | null;

const COMMON_CONDITIONS = [
    'Blinded', 'Charmed', 'Frightened', 'Grappled',
    'Invisible', 'Paralyzed', 'Poisoned', 'Prone', 'Stunned', 'Unconscious'
];

const inputClass = "bg-black/50 border-agent-blue/30 text-white focus-visible:ring-agent-blue focus:border-agent-blue placeholder:text-neutral-600";
const selectClass = "flex h-9 w-full rounded-md border border-agent-blue/30 bg-black/50 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-agent-blue placeholder:text-neutral-600";

export default function QuickActions({ campaignId, characters }: QuickActionsProps) {
    const [active, setActive] = useState<ActionType>(null);

    const toggle = (type: ActionType) => {
        setActive(prev => prev === type ? null : type);
    };

    return (
        <Card variant="agent">
            <CardHeader className="py-2 px-4 bg-agent-navy/50 backdrop-blur-sm border-b border-agent-blue/20">
                <CardTitle className="text-sm text-agent-blue uppercase tracking-widest font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 mt-3">
                <div className="grid grid-cols-4 gap-2">
                    <Button variant="destructive" size="sm" className="w-full shadow-md touch-manipulation font-bold tracking-wider uppercase text-[10px]" onClick={() => toggle('attack')}>Attack</Button>
                    <Button variant="outline" size="sm" className="w-full text-blue-200 border-blue-800 hover:bg-blue-900/50 hover:text-white touch-manipulation font-bold tracking-wider uppercase text-[10px]" onClick={() => toggle('skill')}>Check</Button>
                    <Button variant="outline" size="sm" className="w-full text-purple-200 border-purple-800 hover:bg-purple-900/50 hover:text-white touch-manipulation font-bold tracking-wider uppercase text-[10px]" onClick={() => toggle('spell')}>Spell</Button>
                    <Button variant="ghost" size="sm" className="w-full border border-white/10 hover:bg-white/5 hover:text-white touch-manipulation font-bold tracking-wider uppercase text-[10px]" onClick={() => toggle('note')}>Log</Button>
                </div>

                {active === 'attack' && (
                    <AttackForm campaignId={campaignId} characters={characters} onComplete={() => setActive(null)} onCancel={() => setActive(null)} />
                )}
                {active === 'skill' && (
                    <SkillCheckForm campaignId={campaignId} characters={characters} onComplete={() => setActive(null)} onCancel={() => setActive(null)} />
                )}
                {active === 'spell' && (
                    <SpellForm campaignId={campaignId} characters={characters} onComplete={() => setActive(null)} onCancel={() => setActive(null)} />
                )}
                {active === 'note' && (
                    <NoteForm campaignId={campaignId} onComplete={() => setActive(null)} onCancel={() => setActive(null)} />
                )}
            </CardContent>
        </Card>
    );
}

interface FormProps {
    campaignId: string;
    characters?: CharacterOption[];
    onComplete: () => void;
    onCancel: () => void;
}

function AttackForm({ characters = [], onComplete, onCancel }: FormProps) {
    const [attackerId, setAttackerId] = useState(characters[0]?.id || '');
    const [targetId, setTargetId] = useState('');
    const [damage, setDamage] = useState('');
    const [attackRoll, setAttackRoll] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await performAttack(attackerId, targetId, parseInt(damage) || 0, parseInt(attackRoll) || undefined);
            onComplete();
        } catch (e) {
            console.error(e);
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-agent-navy/90 rounded-lg p-3 border border-red-900/50 shadow-inner space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Attacker</label>
                    <select value={attackerId} onChange={e => setAttackerId(e.target.value)} className={selectClass}>
                        <option value="">Select...</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Target</label>
                    <select value={targetId} onChange={e => setTargetId(e.target.value)} className={selectClass}>
                        <option value="">Select...</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Roll (Optional)</label>
                    <Input type="number" value={attackRoll} onChange={e => setAttackRoll(e.target.value)} placeholder="e.g. 18" className={inputClass} />
                </div>
                <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Damage</label>
                    <Input type="number" value={damage} onChange={e => setDamage(e.target.value)} placeholder="e.g. 8" className={inputClass} />
                </div>
            </div>
            <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 hover:bg-white/5 hover:text-white touch-manipulation">Cancel</Button>
                <Button
                    variant="destructive" size="sm" className="flex-1 touch-manipulation shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                    disabled={!attackerId || !targetId || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? '...' : 'LOG ATTACK'}
                </Button>
            </div>
        </div>
    );
}

function SkillCheckForm({ characters = [], onComplete, onCancel }: FormProps) {
    const [characterId, setCharacterId] = useState(characters[0]?.id || '');
    const [skill, setSkill] = useState('');
    const [dc, setDc] = useState('');
    const [result, setResult] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await performSkillCheck(characterId, skill, parseInt(dc) || undefined, parseInt(result) || 0);
            onComplete();
        } catch (e) {
             console.error(e);
             setSubmitting(false);
        }
    };

    return (
        <div className="bg-agent-navy/90 rounded-lg p-3 border border-blue-900/50 shadow-inner space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Character</label>
                    <select value={characterId} onChange={e => setCharacterId(e.target.value)} className={selectClass}>
                        <option value="">Select...</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Skill</label>
                    <Input value={skill} onChange={e => setSkill(e.target.value)} placeholder="e.g. Perception" className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">DC</label>
                    <Input type="number" value={dc} onChange={e => setDc(e.target.value)} placeholder="15" className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Roll Result</label>
                    <Input type="number" value={result} onChange={e => setResult(e.target.value)} placeholder="18" className={inputClass} />
                </div>
            </div>
            <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 hover:bg-white/5 hover:text-white touch-manipulation">Cancel</Button>
                <Button
                    variant="outline" size="sm" className="flex-1 text-blue-200 border-blue-800 hover:bg-blue-900/50 hover:text-white touch-manipulation shadow-[0_0_10px_rgba(30,64,175,0.4)]"
                    disabled={!characterId || !skill || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? '...' : 'LOG CHECK'}
                </Button>
            </div>
        </div>
    );
}

function SpellForm({ characters = [], onComplete, onCancel }: FormProps) {
    const [casterId, setCasterId] = useState(characters[0]?.id || '');
    const [spell, setSpell] = useState('');
    const [targetId, setTargetId] = useState('');
    const [condition, setCondition] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await castSpell(casterId, targetId || undefined, spell, condition || undefined);
            onComplete();
        } catch (e) {
             console.error(e);
             setSubmitting(false);
        }
    };

    return (
        <div className="bg-agent-navy/90 rounded-lg p-3 border border-purple-900/50 shadow-inner space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Caster</label>
                    <select value={casterId} onChange={e => setCasterId(e.target.value)} className={selectClass}>
                        <option value="">Select...</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Target (Optional)</label>
                    <select value={targetId} onChange={e => setTargetId(e.target.value)} className={selectClass}>
                        <option value="">None</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Spell</label>
                    <Input value={spell} onChange={e => setSpell(e.target.value)} placeholder="e.g. Fireball" className={inputClass} />
                </div>
                <div className="col-span-2">
                    <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Apply Condition (Optional)</label>
                    <select value={condition} onChange={e => setCondition(e.target.value)} className={selectClass}>
                        <option value="">None</option>
                        {COMMON_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 hover:bg-white/5 hover:text-white touch-manipulation">Cancel</Button>
                <Button
                    variant="outline" size="sm" className="flex-1 text-purple-200 border-purple-800 hover:bg-purple-900/50 hover:text-white touch-manipulation shadow-[0_0_10px_rgba(147,51,234,0.4)]"
                    disabled={!casterId || !spell || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? '...' : 'LOG SPELL'}
                </Button>
            </div>
        </div>
    );
}

function NoteForm({ campaignId, onComplete, onCancel }: FormProps) {
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await logAction(campaignId, note.trim(), 'Story');
            onComplete();
        } catch (e) {
             console.error(e);
             setSubmitting(false);
        }
    };

    return (
        <div className="bg-agent-navy/90 rounded-lg p-3 border border-agent-blue/30 shadow-inner space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div>
                <label className="block text-[10px] text-neutral-400 mb-1 uppercase tracking-wide font-bold">Note</label>
                <Input value={note} onChange={e => setNote(e.target.value)} placeholder="What happened..." className={inputClass} />
            </div>
            <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 hover:bg-white/5 hover:text-white touch-manipulation">Cancel</Button>
                <Button
                    variant="outline" size="sm" className="flex-1 border-white/20 text-neutral-300 hover:bg-white/5 hover:text-white touch-manipulation"
                    disabled={!note.trim() || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? '...' : 'LOG NOTE'}
                </Button>
            </div>
        </div>
    );
}
