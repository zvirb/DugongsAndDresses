import { describe, it, expect } from 'vitest';
import { CharacterInputSchema, AttributesSchema, CharacterFormSchema, PartialAttributesSchema } from './schemas';
import { extractAttributesFromFormData, parseCharacterForm } from './safe-json';

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

    it('handles legacy keys (Uppercase/Mixed Case)', () => {
        const input = { Strength: 15, DEXTERITY: 12, WIS: 18 };
        const result = AttributesSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.str).toBe(15);
            expect(result.data.dex).toBe(12);
            expect(result.data.wis).toBe(18);
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

    it('aggressively coerces formatted strings', () => {
        const input = { str: "18 (+4)", dex: "14" };
        const result = AttributesSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.str).toBe(18);
            expect(result.data.dex).toBe(14);
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

    it('handles non-core string attributes', () => {
        const input = {
            str: 18,
            "Class Feature": "Darkvision",
            "Spell Slots": 2
        };
        const result = AttributesSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data['Class Feature']).toBe("Darkvision");
            expect(result.data['Spell Slots']).toBe(2);
            expect(result.data.str).toBe(18);
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

describe('PartialAttributesSchema', () => {
  it('should handle partial input without defaults', () => {
    const input = { str: 15 };
    const result = PartialAttributesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
        expect(result.data).toEqual({ str: 15 });
        expect(result.data).not.toHaveProperty('dex');
    }
  });

  it('should normalize keys in partial input', () => {
    const input = { Strength: "16" };
    const result = PartialAttributesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
        expect(result.data).toEqual({ str: 16 });
    }
  });
});

describe('extractAttributesFromFormData', () => {
  it('should extract core stats', () => {
    const fd = new FormData();
    fd.append('str', '18');
    fd.append('dex', '12');

    const result = extractAttributesFromFormData(fd);
    expect(result).toEqual({ str: 18, dex: 12 });
  });

  it('should extract and normalize long keys (Strength -> str)', () => {
    const fd = new FormData();
    fd.append('Strength', '18');
    fd.append('dexterity', '12');

    const result = extractAttributesFromFormData(fd);
    expect(result).toEqual({ str: 18, dex: 12 });
  });

  it('should handle string coercion ("18 (+4)")', () => {
    const fd = new FormData();
    fd.append('str', '18 (+4)');

    const result = extractAttributesFromFormData(fd);
    expect(result).toEqual({ str: 18 });
  });

  it('should ignore unrelated fields', () => {
    const fd = new FormData();
    fd.append('str', '10');
    fd.append('name', 'Grom');
    fd.append('hp', '20');

    const result = extractAttributesFromFormData(fd);
    expect(result).toEqual({ str: 10 });
    expect(result).not.toHaveProperty('name');
    expect(result).not.toHaveProperty('hp');
  });

  it('should be robust against mixed input', () => {
    const fd = new FormData();
    fd.append('str', '10');
    fd.append('Constitution', '14 (+2)');
    fd.append('wis', 'invalid');

    const result = extractAttributesFromFormData(fd);
    expect(result).toEqual({ str: 10, con: 14 });
    expect(result).not.toHaveProperty('wis');
  });
});

describe('parseCharacterForm (Attributes)', () => {
    it('should trigger attribute extraction if only long keys are present', () => {
      const fd = new FormData();
      fd.append('name', 'Test Char');
      fd.append('Strength', '18');

      const result = parseCharacterForm(fd, true); // partial update
      expect(result.attributes).toBeDefined();
      expect(result.attributes).toEqual({ str: 18 });
    });

    it('should NOT trigger attribute extraction if no attribute keys present (partial)', () => {
      const fd = new FormData();
      fd.append('name', 'Test Char');

      const result = parseCharacterForm(fd, true);
      expect(result.attributes).toBeUndefined();
    });
});
