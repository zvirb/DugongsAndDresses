import { describe, it, expect } from 'vitest';
import { BackupDataSchema } from './backup';

describe('BackupDataSchema', () => {
    it('should validate correct backup data structure', () => {
        const validBackup = {
            timestamp: "2024-05-25T10:00:00.000Z",
            campaigns: [{
                id: "c1",
                name: "Test Campaign",
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }],
            characters: [{
                id: "char1",
                name: "Grom",
                type: "PLAYER",
                race: "Orc",
                class: "Barbarian",
                level: 5,
                imageUrl: null,
                hp: 50,
                maxHp: 50,
                armorClass: 14,
                speed: 30,
                initiative: 2,
                attributes: JSON.stringify({ str: 18, dex: 14 }),
                inventory: JSON.stringify(["Axe"]),
                conditions: "[]",
                campaignId: "c1",
                activeTurn: false,
                initiativeRoll: 15,
                createdAt: new Date(),
                updatedAt: new Date(),
                sourceId: null
            }],
            logs: [],
            encounters: []
        };

        const result = BackupDataSchema.safeParse(validBackup);
        expect(result.success).toBe(true);
    });

    it('should fail if character attributes are not a string (simulating raw object instead of stringified JSON)', () => {
        const invalidBackup = {
            timestamp: "2024-05-25",
            campaigns: [],
            characters: [{
                id: "char1",
                name: "Grom",
                type: "PLAYER",
                race: "Orc",
                class: "Barbarian",
                level: 5,
                imageUrl: null,
                hp: 50,
                maxHp: 50,
                armorClass: 14,
                speed: 30,
                initiative: 2,
                // Error: Object instead of String
                attributes: { str: 18 },
                inventory: "[]",
                conditions: "[]",
                campaignId: "c1",
                activeTurn: false,
                initiativeRoll: 15,
                createdAt: new Date(),
                updatedAt: new Date(),
                sourceId: null
            }],
            logs: [],
            encounters: []
        };
        const result = BackupDataSchema.safeParse(invalidBackup);
        expect(result.success).toBe(false);
    });
});
