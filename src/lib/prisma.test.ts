import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from './prisma';

describe('Database Standardization', () => {
    let campaignId: string;

    beforeAll(async () => {
        // Cleanup and setup
        await prisma.campaign.deleteMany();
        const campaign = await prisma.campaign.create({
            data: {
                name: 'Test Campaign',
                characters: {
                    create: [
                        {
                            name: 'Test Character',
                            hp: 10,
                            maxHp: 10,
                            armorClass: 10,
                        }
                    ]
                }
            }
        });
        campaignId = campaign.id;
    });

    it('should have timestamps on Campaign', async () => {
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId }
        });
        expect(campaign?.createdAt).toBeInstanceOf(Date);
        expect(campaign?.updatedAt).toBeInstanceOf(Date);
    });

    it('should have timestamps on Character', async () => {
        const character = await prisma.character.findFirst({
            where: { campaignId }
        });
        expect(character?.createdAt).toBeInstanceOf(Date);
        expect(character?.updatedAt).toBeInstanceOf(Date);
    });

    it('should support cascade delete', async () => {
        // Delete campaign
        await prisma.campaign.delete({
            where: { id: campaignId }
        });

        // Check if character is also deleted
        const character = await prisma.character.findFirst({
            where: { campaignId }
        });
        expect(character).toBeNull();
    });

    it('should have default values for attributes and conditions', async () => {
        const campaign = await prisma.campaign.create({
            data: {
                name: 'Defaults Test',
                characters: {
                    create: [
                        {
                            name: 'No Attributes',
                            hp: 10,
                            maxHp: 10,
                            armorClass: 10,
                        }
                    ]
                }
            }
        });

        const character = await prisma.character.findFirst({
            where: { campaignId: campaign.id }
        });

        expect(character?.attributes).toBe('{}');
        expect(character?.conditions).toBe('[]');
    });
});
