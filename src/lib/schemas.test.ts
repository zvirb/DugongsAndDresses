import { describe, it, expect } from 'vitest';
import { CharacterInputSchema, AttributesSchema, CharacterFormSchema } from './schemas';

describe('CharacterInputSchema', () => {
    it('validates a correct character input', () => {
        const input = {
            name: "Hero",
            type: "PLAYER",
            hp: 10,
            maxHp: 10,
            armorClass: 15,
            attributes: { str: 10, dex: 12 }
        };
        const result = CharacterInputSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe("Hero");
            expect(result.data.level).toBe(1); // Default
        }
    });

    it('fails if name is missing', () => {
        const input = {
            type: "PLAYER",
            hp: 10,
            maxHp: 10,
            armorClass: 15
        };
        const result = CharacterInputSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it('fails if hp is not an integer', () => {
        const input = {
            name: "Hero",
            hp: 10.5,
            maxHp: 10,
            armorClass: 15
        };
        const result = CharacterInputSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it('validates attributes structure', () => {
        const input = {
            name: "Hero",
            hp: 10,
            maxHp: 10,
            armorClass: 15,
            attributes: { str: "strong" } // Invalid value
        };
        const result = CharacterInputSchema.safeParse(input);
        // Schema is forgiving and defaults invalid values
        expect(result.success).toBe(true);
        if (result.success && result.data.attributes) {
             expect(result.data.attributes.str).toBe(10);
        }
    });

    it('accepts optional fields', () => {
         const input = {
            name: "Hero",
            hp: 10,
            maxHp: 10,
            armorClass: 15,
            class: "Fighter",
            race: "Human"
        };
        const result = CharacterInputSchema.safeParse(input);
        expect(result.success).toBe(true);
    });
});

describe('AttributesSchema', () => {
    it('handles legacy keys', () => {
        const input = { strength: 18, dexterity: 14 };
        const result = AttributesSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.str).toBe(18);
            expect(result.data.dex).toBe(14);
            // Default check
            expect(result.data.con).toBe(10);
        }
    });

    it('coerces strings to numbers', () => {
        const input = { str: "18", dex: "14.5" };
        const result = AttributesSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.str).toBe(18);
            expect(result.data.dex).toBe(14.5);
        }
    });

    it('removes invalid string numbers', () => {
        const input = { str: "invalid", dex: 12 };
        const result = AttributesSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            // Should fallback to default 10
            expect(result.data.str).toBe(10);
            expect(result.data.dex).toBe(12);
        }
    });
});

describe('CharacterFormSchema', () => {
    it('coerces numeric fields from strings', () => {
        const input = {
            name: "Test",
            hp: "20",
            maxHp: "20",
            level: "5"
        };
        const result = CharacterFormSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.hp).toBe(20);
            expect(result.data.maxHp).toBe(20);
            expect(result.data.level).toBe(5);
        }
    });

    it('handles defaults for missing numeric fields', () => {
        const input = { name: "Test" };
        const result = CharacterFormSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.hp).toBe(10);
            expect(result.data.level).toBe(1);
        }
    });

    it('handles empty strings for optional fields as null', () => {
        const input = { name: "Test", race: "", class: "" };
        const result = CharacterFormSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.race).toBeNull();
            expect(result.data.class).toBeNull();
        }
    });
});
