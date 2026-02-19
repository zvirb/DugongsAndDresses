import { describe, it, expect } from 'vitest';
import { BackupDataSchema } from './backup';

// Mock valid date
const validDate = new Date();

describe('BackupDataSchema', () => {
    it('validates correct backup data', () => {
        const validData = {
            timestamp: "2024-01-01",
            campaigns: [],
            characters: [
                {
                    id: "char1",
                    name: "Hero",
                    type: "PLAYER",
                    race: "Human",
                    class: "Fighter",
                    level: 1,
                    imageUrl: null,
                    hp: 10,
                    maxHp: 10,
                    armorClass: 10,
                    speed: 30,
                    initiative: 0,
                    attributes: JSON.stringify({ str: 10, dex: 10 }), // Valid JSON
                    inventory: "[]",
                    conditions: "[]",
                    campaignId: "camp1",
                    activeTurn: false,
                    initiativeRoll: 0,
                    createdAt: validDate,
                    updatedAt: validDate,
                    sourceId: null
                }
            ],
            logs: [],
            encounters: []
        };

        const result = BackupDataSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('rejects invalid JSON in attributes', () => {
        const invalidData = {
            timestamp: "2024-01-01",
            campaigns: [],
            characters: [
                {
                    id: "char1",
                    name: "Hero",
                    type: "PLAYER",
                    race: "Human",
                    class: "Fighter",
                    level: 1,
                    imageUrl: null,
                    hp: 10,
                    maxHp: 10,
                    armorClass: 10,
                    speed: 30,
                    initiative: 0,
                    attributes: "{ invalid json }", // INVALID
                    inventory: "[]",
                    conditions: "[]",
                    campaignId: "camp1",
                    activeTurn: false,
                    initiativeRoll: 0,
                    createdAt: validDate,
                    updatedAt: validDate,
                    sourceId: null
                }
            ],
            logs: [],
            encounters: []
        };

        const result = BackupDataSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
             // Check if the error is about attributes
             const error = result.error.errors.find(e => e.path.includes('attributes'));
             expect(error).toBeDefined();
             expect(error?.message).toBe("Invalid attributes JSON");
        }
    });

    it('rejects invalid schema in attributes (not an object)', () => {
        const invalidData = {
            timestamp: "2024-01-01",
            campaigns: [],
            characters: [
                {
                    id: "char1",
                    name: "Hero",
                    type: "PLAYER",
                    race: "Human",
                    class: "Fighter",
                    level: 1,
                    imageUrl: null,
                    hp: 10,
                    maxHp: 10,
                    armorClass: 10,
                    speed: 30,
                    initiative: 0,
                    attributes: "123", // Valid JSON but not an object matching schema
                    inventory: "[]",
                    conditions: "[]",
                    campaignId: "camp1",
                    activeTurn: false,
                    initiativeRoll: 0,
                    createdAt: validDate,
                    updatedAt: validDate,
                    sourceId: null
                }
            ],
            logs: [],
            encounters: []
        };

        const result = BackupDataSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
         if (!result.success) {
             const error = result.error.errors.find(e => e.path.includes('attributes'));
             expect(error).toBeDefined();
        }
    });
});
