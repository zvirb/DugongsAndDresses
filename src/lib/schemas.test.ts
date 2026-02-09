import { describe, it, expect } from 'vitest';
import { CharacterInputSchema } from './schemas';

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
        expect(result.success).toBe(false);
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
