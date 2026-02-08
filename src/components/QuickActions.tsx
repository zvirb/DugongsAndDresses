'use client';

import { useState } from 'react';
import { logAction } from '@/app/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface QuickActionsProps {
    campaignId: string;
    characterNames: string[];
}

type ActionType = 'attack' | 'skill' | 'spell' | 'note' | null;

export default function QuickActions({ campaignId, characterNames }: QuickActionsProps) {
    const [active, setActive] = useState<ActionType>(null);
    const [submitting, setSubmitting] = useState(false);

    const toggle = (type: ActionType) => {
        setActive(prev => prev === type ? null : type);
    };

    const submit = async (content: string, type: string) => {
        setSubmitting(true);
        await logAction(campaignId, content, type);
        setActive(null);
        setSubmitting(false);
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
                    <AttackForm campaignId={campaignId} characterNames={characterNames} onSubmit={submit} submitting={submitting} onCancel={() => setActive(null)} />
                )}
                {active === 'skill' && (
                    <SkillCheckForm campaignId={campaignId} characterNames={characterNames} onSubmit={submit} submitting={submitting} onCancel={() => setActive(null)} />
                )}
                {active === 'spell' && (
                    <SpellForm campaignId={campaignId} characterNames={characterNames} onSubmit={submit} submitting={submitting} onCancel={() => setActive(null)} />
                )}
                {active === 'note' && (
                    <NoteForm onSubmit={submit} submitting={submitting} onCancel={() => setActive(null)} />
                )}
            </CardContent>
        </Card>
    );
}

interface FormProps {
    campaignId?: string;
    characterNames?: string[];
    onSubmit: (content: string, type: string) => Promise<void>;
    submitting: boolean;
    onCancel: () => void;
}

function AttackForm({ characterNames = [], onSubmit, submitting, onCancel }: FormProps) {
    const [attacker, setAttacker] = useState(characterNames[0] || '');
    const [target, setTarget] = useState('');
    const [damage, setDamage] = useState('');

    return (
        <div className="bg-neutral-900 rounded-lg p-3 border border-red-900/30 space-y-2">
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Attacker</label>
                    <select value={attacker} onChange={e => setAttacker(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-sm text-neutral-100">
                        <option value="">Select...</option>
                        {characterNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Target</label>
                    <Input value={target} onChange={e => setTarget(e.target.value)} placeholder="Target name" className="bg-neutral-950 border-neutral-700" />
                </div>
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Damage</label>
                    <Input value={damage} onChange={e => setDamage(e.target.value)} placeholder="e.g. 8" className="bg-neutral-950 border-neutral-700" />
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
                <Button
                    variant="destructive" size="sm" className="flex-1"
                    disabled={!attacker || !target || submitting}
                    onClick={() => {
                        const dmg = damage ? ` for **${damage}** damage` : '';
                        onSubmit(`**${attacker}** strikes at **${target}**${dmg}!`, 'Combat');
                    }}
                >
                    {submitting ? '...' : 'Log Attack'}
                </Button>
            </div>
        </div>
    );
}

function SkillCheckForm({ characterNames = [], onSubmit, submitting, onCancel }: FormProps) {
    const [character, setCharacter] = useState(characterNames[0] || '');
    const [skill, setSkill] = useState('');
    const [dc, setDc] = useState('');
    const [result, setResult] = useState('');

    return (
        <div className="bg-neutral-900 rounded-lg p-3 border border-blue-900/30 space-y-2">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Character</label>
                    <select value={character} onChange={e => setCharacter(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-sm text-neutral-100">
                        <option value="">Select...</option>
                        {characterNames.map(n => <option key={n} value={n}>{n}</option>)}
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
                    disabled={!character || !skill || submitting}
                    onClick={() => {
                        const dcStr = dc ? ` (DC ${dc})` : '';
                        const resultStr = result ? ` — rolled **${result}**` : '';
                        onSubmit(`**${character}** tests their **${skill}**${dcStr}${resultStr}.`, 'Roll');
                    }}
                >
                    {submitting ? '...' : 'Log Check'}
                </Button>
            </div>
        </div>
    );
}

function SpellForm({ characterNames = [], onSubmit, submitting, onCancel }: FormProps) {
    const [caster, setCaster] = useState(characterNames[0] || '');
    const [spell, setSpell] = useState('');
    const [target, setTarget] = useState('');

    return (
        <div className="bg-neutral-900 rounded-lg p-3 border border-purple-900/30 space-y-2">
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Caster</label>
                    <select value={caster} onChange={e => setCaster(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1 text-sm text-neutral-100">
                        <option value="">Select...</option>
                        {characterNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Spell</label>
                    <Input value={spell} onChange={e => setSpell(e.target.value)} placeholder="e.g. Fireball" className="bg-neutral-950 border-neutral-700" />
                </div>
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Target</label>
                    <Input value={target} onChange={e => setTarget(e.target.value)} placeholder="Target" className="bg-neutral-950 border-neutral-700" />
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
                <Button
                    variant="secondary" size="sm" className="flex-1 text-purple-300"
                    disabled={!caster || !spell || submitting}
                    onClick={() => {
                        const tgt = target ? ` on **${target}**` : '';
                        onSubmit(`**${caster}** incants **${spell}**${tgt}!`, 'Combat');
                    }}
                >
                    {submitting ? '...' : 'Log Spell'}
                </Button>
            </div>
        </div>
    );
}

function NoteForm({ onSubmit, submitting, onCancel }: FormProps) {
    const [note, setNote] = useState('');

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
                    onClick={() => onSubmit(note.trim(), 'Story')}
                >
                    {submitting ? '...' : 'Log Note'}
                </Button>
            </div>
        </div>
    );
}
