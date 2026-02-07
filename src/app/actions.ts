'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { actionWrapper, ActionResult } from "@/lib/actions-utils";

export async function createCampaign(formData: FormData): Promise<ActionResult> {
    return actionWrapper("createCampaign", async () => {
        const name = formData.get("name") as string;
        if (!name || name.trim().length === 0) {
            throw new Error("Campaign name is required");
        }

        const campaign = await prisma.campaign.create({
            data: {
                name: name.trim(),
                active: true,
                characters: {
                    create: [
                        {
                            name: "Grom", type: "PLAYER", race: "Orc", class: "Barbarian",
                            hp: 25, maxHp: 25, armorClass: 14, initiative: 2,
                            attributes: JSON.stringify({ str: 16, dex: 12 }),
                            initiativeRoll: 0
                        },
                        {
                            name: "Elara", type: "PLAYER", race: "Elf", class: "Wizard",
                            hp: 12, maxHp: 12, armorClass: 11, initiative: 3,
                            attributes: JSON.stringify({ int: 17, dex: 14 }),
                            initiativeRoll: 0
                        }
                    ]
                }
            }
        });

        revalidatePath('/dm');
        revalidatePath('/public');
        return campaign;
    });
}

export async function logAction(campaignId: string, content: string, type: string = "Story"): Promise<ActionResult> {
    return actionWrapper("logAction", async () => {
        if (!campaignId) throw new Error("Campaign ID is required");
        if (!content) throw new Error("Content is required");
        
        const entry = await prisma.logEntry.create({ data: { campaignId, content, type } });
        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');
        return entry;
    });
}

export async function updateHP(characterId: string, delta: number): Promise<ActionResult> {
    return actionWrapper("updateHP", async () => {
        if (!characterId) throw new Error("Character ID is required");
        
        const character = await prisma.character.update({
            where: { id: characterId },
            data: { hp: { increment: delta } }
        });

        const absDelta = Math.abs(delta);
        const content = delta > 0
            ? `**${character.name}** heals **${absDelta}** HP.`
            : `**${character.name}** takes **${absDelta}** damage.`;

        await logAction(character.campaignId, content, "Combat");

        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');
        return character;
    });
}

export async function updateInitiative(characterId: string, roll: number): Promise<ActionResult> {
    return actionWrapper("updateInitiative", async () => {
        if (!characterId) throw new Error("Character ID is required");
        
        const character = await prisma.character.update({
            where: { id: characterId },
            data: { initiativeRoll: roll }
        });

        await logAction(character.campaignId, `**${character.name}** rolls initiative: **${roll}**.`, "Combat");

        revalidatePath('/dm');
        return character;
    });
}

export async function advanceTurn(campaignId: string, expectedActiveId?: string): Promise<ActionResult> {
    return actionWrapper("advanceTurn", async () => {
        if (!campaignId) throw new Error("Campaign ID is required");

        // 1. Fetch all characters to determine order
        const characters = await prisma.character.findMany({
            where: { campaignId },
            orderBy: [
                { initiativeRoll: 'desc' },
                { id: 'asc' } // Stable sort
            ],
            select: {
                id: true,
                activeTurn: true
            }
        });

        if (characters.length === 0) {
            throw new Error("No characters in campaign");
        }

        // 2. Find current active character
        const currentIndex = characters.findIndex(c => c.activeTurn);

        // 3. Concurrency Check: If expectedActiveId is provided, verify it matches DB
        if (expectedActiveId && currentIndex !== -1) {
            const currentActive = characters[currentIndex];
            if (currentActive.id !== expectedActiveId) {
                // State mismatch: Turn already advanced or changed.
                // Return the actual active character (no-op)
                const actualActive = await prisma.character.findUnique({ where: { id: currentActive.id } });
                return actualActive;
            }
        }

        // 4. Calculate Next Index (Looping)
        let nextIndex = 0;
        if (currentIndex !== -1) {
            nextIndex = (currentIndex + 1) % characters.length;
        }

        const nextCharId = characters[nextIndex].id;

        // 5. Update Database (Transaction for atomicity)
        const [_, newActiveChar] = await prisma.$transaction([
            // Unset current
            prisma.character.updateMany({
                where: { campaignId, activeTurn: true },
                data: { activeTurn: false }
            }),
            // Set next
            prisma.character.update({
                where: { id: nextCharId },
                data: { activeTurn: true }
            })
        ]);

        await logAction(campaignId, `It is now **${character.name}**'s turn.`, "Combat");

        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');

        return newActiveChar;
    });
}

export async function activateCampaign(campaignId: string): Promise<ActionResult> {
    return actionWrapper("activateCampaign", async () => {
        if (!campaignId) throw new Error("Campaign ID is required");

        // Deactivate all active campaigns
        await prisma.campaign.updateMany({
            where: { active: true },
            data: { active: false }
        });

        // Activate target
        const campaign = await prisma.campaign.update({
            where: { id: campaignId },
            data: { active: true }
        });

        revalidatePath('/dm');
        revalidatePath('/public');
        return campaign;
    });
}

export async function updateCharacterImage(characterId: string, imageUrl: string): Promise<ActionResult> {
    return actionWrapper("updateCharacterImage", async () => {
        if (!characterId) throw new Error("Character ID is required");
        if (!imageUrl) throw new Error("Image URL is required");

        const character = await prisma.character.update({
            where: { id: characterId },
            data: { imageUrl }
        });
        revalidatePath('/public');
        revalidatePath('/dm');
        return character;
    });
}

// Very basic file upload handler (Local FS only)
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
    return actionWrapper("uploadAvatar", async () => {
        const file = formData.get('file') as File;
        const characterId = formData.get('characterId') as string;

        if (!file || !characterId) {
            throw new Error("File and Character ID are required");
        }

        // Basic validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            throw new Error("Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.");
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error("File size too large. Maximum 5MB allowed.");
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const uploadDir = join(process.cwd(), 'public/avatars');
        await mkdir(uploadDir, { recursive: true });

        // Safe filename
        const filename = `${characterId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const path = join(uploadDir, filename);

        await writeFile(path, buffer);

        const imageUrl = `/avatars/${filename}`;
        await updateCharacterImage(characterId, imageUrl);
        
        return { imageUrl };
    });
}
