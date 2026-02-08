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

export default function QuickActions({ campaignId, characters }: QuickActionsProps) {
    const [active, setActive] = useState<ActionType>(null);

    const toggle = (type: ActionType) => {
        setActive(prev => prev === type ? null : type);
    };

    return (
        <Card variant="agent">
            <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm text-neutral-400">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                <div className="grid grid-cols-4 gap-2">
                    <Button variant="destructive" size="sm" className="w-full" onClick={() => toggle('attack')}>Attack</Button>
                    <Button variant="secondary" size="sm" className="w-full text-blue-300 border-blue-900/50 hover:bg-blue-900/30" onClick={() => toggle('skill')}>Skill Check</Button>
                    <Button variant="secondary" size="sm" className="w-full text-purple-300 border-purple-900/50 hover:bg-purple-900/30" onClick={() => toggle('spell')}>Cast Spell</Button>
                    <Button variant="ghost" size="sm" className="w-full border border-neutral-600" onClick={() => toggle('note')}>Log Note</Button>
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
        <div className="bg-neutral-900 rounded-lg p-3 border border-red-900/30 space-y-2">
            <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Attacker</label>
                    <select value={attackerId} onChange={e => setAttackerId(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-sm text-neutral-100">
                        <option value="">Select...</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Target</label>
                    <select value={targetId} onChange={e => setTargetId(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-sm text-neutral-100">
                        <option value="">Select...</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Roll (Optional)</label>
                    <Input type="number" value={attackRoll} onChange={e => setAttackRoll(e.target.value)} placeholder="e.g. 18" className="bg-neutral-950 border-neutral-700" />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Damage</label>
                    <Input type="number" value={damage} onChange={e => setDamage(e.target.value)} placeholder="e.g. 8" className="bg-neutral-950 border-neutral-700" />
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
                <Button
                    variant="destructive" size="sm" className="flex-1"
                    disabled={!attackerId || !targetId || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? '...' : 'Log Attack'}
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
        <div className="bg-neutral-900 rounded-lg p-3 border border-blue-900/30 space-y-2">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Character</label>
                    <select value={characterId} onChange={e => setCharacterId(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-sm text-neutral-100">
                        <option value="">Select...</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Skill</label>
                    <Input value={skill} onChange={e => setSkill(e.target.value)} placeholder="e.g. Perception" className="bg-neutral-950 border-neutral-700" />
                </div>
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">DC</label>
                    <Input type="number" value={dc} onChange={e => setDc(e.target.value)} placeholder="15" className="bg-neutral-950 border-neutral-700" />
                </div>
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Roll Result</label>
                    <Input type="number" value={result} onChange={e => setResult(e.target.value)} placeholder="18" className="bg-neutral-950 border-neutral-700" />
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
                <Button
                    variant="secondary" size="sm" className="flex-1 text-blue-300"
                    disabled={!characterId || !skill || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? '...' : 'Log Check'}
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
        <div className="bg-neutral-900 rounded-lg p-3 border border-purple-900/30 space-y-2">
            <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Caster</label>
                    <select value={casterId} onChange={e => setCasterId(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-sm text-neutral-100">
                        <option value="">Select...</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Target (Optional)</label>
                    <select value={targetId} onChange={e => setTargetId(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-sm text-neutral-100">
                        <option value="">None</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Spell</label>
                    <Input value={spell} onChange={e => setSpell(e.target.value)} placeholder="e.g. Fireball" className="bg-neutral-950 border-neutral-700" />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Apply Condition (Optional)</label>
                    <select value={condition} onChange={e => setCondition(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-sm text-neutral-100">
                        <option value="">None</option>
                        {COMMON_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
                <Button
                    variant="secondary" size="sm" className="flex-1 text-purple-300"
                    disabled={!casterId || !spell || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? '...' : 'Log Spell'}
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
        <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-700 space-y-2">
            <div>
                <label className="block text-xs text-neutral-400 mb-1">Note</label>
                <Input value={note} onChange={e => setNote(e.target.value)} placeholder="What happened..." className="bg-neutral-950 border-neutral-700" />
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
                <Button
                    variant="ghost" size="sm" className="flex-1 border border-neutral-600"
                    disabled={!note.trim() || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? '...' : 'Log Note'}
                </Button>
            </div>
        </div>
    );
}
