import { describe, it, expect } from 'vitest';
import { generateAIContext } from './aiContext';
import { Character, LogEntry } from '@/types';

describe('generateAIContext', () => {
    it('adds [DOWN] status when HP is 0 or less', () => {
        const characters = [{
            id: '1', name: 'DeadGuy', hp: 0, maxHp: 10, type: 'NPC',
            conditions: '[]', attributes: '{}', inventory: '[]',
            activeTurn: false, level: 1, armorClass: 10
        }] as unknown as Character[];
        const logs: LogEntry[] = [];
        const turnOrder: any[] = [];

        const context = generateAIContext(logs, characters, turnOrder);
        expect(context).toContain('Cond:[DOWN]');
    });

    it('formats timestamps in 24h format', () => {
        const logs = [{
            id: '1', content: 'Test log', timestamp: new Date('2023-01-01T15:30:00'), type: 'Story'
        }] as unknown as LogEntry[];
        const characters: Character[] = [];
        const turnOrder: any[] = [];

        const context = generateAIContext(logs, characters, turnOrder);
        // Expect 24-hour format
        expect(context).toMatch(/15:30:00/);
    });

    it('includes extra attributes like SpellSlots', () => {
        const characters = [{
            id: '1', name: 'Mage', hp: 10, maxHp: 10, type: 'PLAYER',
            conditions: '[]', attributes: JSON.stringify({ spellSlots: 3, ki: 2 }), inventory: '[]',
            activeTurn: false, level: 1, armorClass: 10
        }] as unknown as Character[];
        const logs: LogEntry[] = [];
        const turnOrder: any[] = [];

        const context = generateAIContext(logs, characters, turnOrder);
        // We expect these to be present
        expect(context).toMatch(/SpellSlots:3/);
        expect(context).toMatch(/Ki:2/);
    });

    it('includes string attributes like ClassFeatures', () => {
        const characters = [{
            id: '1', name: 'Barbarian', hp: 10, maxHp: 10, type: 'PLAYER',
            conditions: '[]', attributes: JSON.stringify({ str: 18, rage: 'Active', deity: 'Kord' }), inventory: '[]',
            activeTurn: false, level: 1, armorClass: 16
        }] as unknown as Character[];
        const logs: LogEntry[] = [];
        const turnOrder: any[] = [];

        const context = generateAIContext(logs, characters, turnOrder);
        // Expect string attributes to be present in Resources
        expect(context).toContain('Rage:Active');
        expect(context).toContain('Deity:Kord');
    });

    it('marks the active turn correctly', () => {
        const characters = [{
            id: '1', name: 'Hero', hp: 10, maxHp: 10, type: 'PLAYER',
            conditions: '[]', attributes: '{}', inventory: '[]',
            activeTurn: true, level: 1, armorClass: 10
        }] as unknown as Character[];
        const logs: LogEntry[] = [];
        const turnOrder = [{ name: 'Hero', init: 20, current: true }];

        const context = generateAIContext(logs, characters, turnOrder);
        expect(context).toContain('▶ [ACTIVE] Hero');
        expect(context).toContain('▶ [CURRENT] Hero');
    });

    it('formats HP with percentage and separates resources', () => {
        const characters = [{
            id: '1', name: 'Warrior', hp: 5, maxHp: 10, type: 'PLAYER',
            conditions: '[]', attributes: JSON.stringify({ str: 18, spellSlots: 2 }), inventory: '[]',
            activeTurn: false, level: 1, armorClass: 16
        }] as unknown as Character[];
        const logs: LogEntry[] = [];
        const turnOrder: any[] = [];

        const context = generateAIContext(logs, characters, turnOrder);
        // Expect HP percentage
        expect(context).toContain('HP:5/10 (50%)');
        // Expect Stats separation with new bracket format
        expect(context).toContain('Stats:[STR:18');
        expect(context).toContain('Res:[SpellSlots:2]');
    });
});
