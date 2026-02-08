'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { actionWrapper, ActionResult } from "@/lib/actions-utils";
import { stringifyAttributes, stringifyConditions, parseInventory, stringifyInventory } from "@/lib/safe-json";

export interface CharacterInput {
    name: string;
    type: string;
    race?: string;
    class?: string;
    level?: number;
    hp: number;
    maxHp: number;
    armorClass: number;
    speed?: number;
    initiative?: number;
    attributes?: Record<string, number>;
}

export async function createCampaign(formData: FormData): Promise<ActionResult> {
    return actionWrapper("createCampaign", async () => {
        const name = formData.get("name") as string;
        if (!name || name.trim().length === 0) {
            throw new Error("Campaign name is required");
        }

        const charactersJson = formData.get("characters") as string;
        let characters: CharacterInput[] = [];
        try {
            if (charactersJson) {
                const parsed = JSON.parse(charactersJson);
                if (Array.isArray(parsed)) {
                    characters = parsed;
                }
            }
        } catch (e) {
            console.error("Failed to parse characters JSON:", e);
        }

        const campaign = await prisma.campaign.create({
            data: {
                name: name.trim(),
                active: true,
                ...(characters.length > 0 ? {
                    characters: {
                        create: characters.map(c => ({
                            name: c.name,
                            type: c.type || "PLAYER",
                            race: c.race || null,
                            class: c.class || null,
                            level: c.level || 1,
                            hp: c.hp,
                            maxHp: c.maxHp,
                            armorClass: c.armorClass,
                            speed: c.speed || 30,
                            initiative: c.initiative || 0,
                            attributes: c.attributes ? stringifyAttributes(c.attributes) : "{}",
                            initiativeRoll: 0,
                        }))
                    }
                } : {})
            }
        });

        await logAction(campaign.id, `Campaign **${campaign.name}** created.`, "Story");

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

        if (delta !== 0) {
            const verb = delta > 0 ? "recovers" : "takes";
            const amount = Math.abs(delta);
            const suffix = delta > 0 ? "HP" : "damage";
            const content = `**${character.name}** ${verb} **${amount}** ${suffix}.`;
            await logAction(character.campaignId, content, "Combat");
        }

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

        const content = `**${character.name}** rolls **${roll}** for initiative.`;
        await logAction(character.campaignId, content, "Combat");

        revalidatePath('/dm');
        return character;
    });
}

export async function advanceTurn(campaignId: string, expectedActiveId?: string): Promise<ActionResult> {
    return actionWrapper("advanceTurn", async () => {
        if (!campaignId || campaignId.trim().length === 0) {
            throw new Error("Campaign ID is required");
        }

        const characters = await prisma.character.findMany({
            where: { campaignId },
            orderBy: [
                { initiativeRoll: 'desc' },
                { id: 'asc' }
            ],
            select: {
                id: true,
                activeTurn: true
            }
        });

        if (characters.length === 0) {
            throw new Error("No characters in campaign");
        }

        const currentIndex = characters.findIndex(c => c.activeTurn);

        // --- SENTRY'S GUARD: RACE CONDITION CHECK ---
        // If the client expects a specific character to be active, but the DB disagrees,
        // it means another action has already advanced the turn.
        // We return the ACTUAL active character to sync the client, without advancing again.
        if (expectedActiveId && currentIndex !== -1) {
            const currentActive = characters[currentIndex];
            if (currentActive.id !== expectedActiveId) {
                const actualActive = await prisma.character.findUnique({ where: { id: currentActive.id } });
                return actualActive;
            }
        }

        let nextIndex = 0;
        if (currentIndex !== -1) {
            nextIndex = (currentIndex + 1) % characters.length;
        }

        const nextCharId = characters[nextIndex].id;

        const [, newActiveChar] = await prisma.$transaction([
            prisma.character.updateMany({
                where: { campaignId, activeTurn: true },
                data: { activeTurn: false }
            }),
            prisma.character.update({
                where: { id: nextCharId },
                data: { activeTurn: true }
            })
        ]);

        return newActiveChar;
    });
}

export async function activateCampaign(campaignId: string): Promise<ActionResult> {
    return actionWrapper("activateCampaign", async () => {
        if (!campaignId) throw new Error("Campaign ID is required");

        await prisma.campaign.updateMany({
            where: { active: true },
            data: { active: false }
        });

        const campaign = await prisma.campaign.update({
            where: { id: campaignId },
            data: { active: true }
        });

        const content = `Campaign **${campaign.name}** activated.`;
        await logAction(campaignId, content, "Story");

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

        const content = `**${character.name}** updates their appearance.`;
        await logAction(character.campaignId, content, "Story");

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

        const uploadDir = join(process.cwd(), 'public/avatars');
        await mkdir(uploadDir, { recursive: true });

        const filename = `${characterId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const path = join(uploadDir, filename);

        await writeFile(path, buffer);

        const imageUrl = `/avatars/${filename}`;
        await updateCharacterImage(characterId, imageUrl);

        return { imageUrl };
    });
}

// --- Character Management ---

export async function createCharacter(formData: FormData): Promise<ActionResult> {
    return actionWrapper("createCharacter", async () => {
        const campaignId = formData.get("campaignId") as string;
        const name = formData.get("name") as string;
        if (!campaignId || !name) throw new Error("Campaign ID and name are required");

        const character = await prisma.character.create({
            data: {
                campaignId,
                name: name.trim(),
                type: (formData.get("type") as string) || "PLAYER",
                race: (formData.get("race") as string) || null,
                class: (formData.get("class") as string) || null,
                level: parseInt(formData.get("level") as string) || 1,
                hp: parseInt(formData.get("hp") as string) || 10,
                maxHp: parseInt(formData.get("maxHp") as string) || 10,
                armorClass: parseInt(formData.get("armorClass") as string) || 10,
                speed: parseInt(formData.get("speed") as string) || 30,
                initiative: parseInt(formData.get("initiative") as string) || 0,
                attributes: stringifyAttributes({
                    str: parseInt(formData.get("str") as string) || 10,
                    dex: parseInt(formData.get("dex") as string) || 10,
                    con: parseInt(formData.get("con") as string) || 10,
                    int: parseInt(formData.get("int") as string) || 10,
                    wis: parseInt(formData.get("wis") as string) || 10,
                    cha: parseInt(formData.get("cha") as string) || 10,
                }),
                initiativeRoll: 0,
            }
        });

        await logAction(campaignId, `**${character.name}** joins the adventure.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');
        return character;
    });
}

export async function updateCharacter(characterId: string, formData: FormData): Promise<ActionResult> {
    return actionWrapper("updateCharacter", async () => {
        if (!characterId) throw new Error("Character ID is required");

        const nameVal = formData.get("name") as string;
        const typeVal = formData.get("type") as string;
        const raceVal = formData.get("race") as string;
        const classVal = formData.get("class") as string;

        const character = await prisma.character.update({
            where: { id: characterId },
            data: {
                name: nameVal || undefined,
                type: typeVal || undefined,
                race: raceVal !== null ? (raceVal.trim() || null) : undefined,
                class: classVal !== null ? (classVal.trim() || null) : undefined,
                level: formData.get("level") ? parseInt(formData.get("level") as string) : undefined,
                hp: formData.get("hp") ? parseInt(formData.get("hp") as string) : undefined,
                maxHp: formData.get("maxHp") ? parseInt(formData.get("maxHp") as string) : undefined,
                armorClass: formData.get("armorClass") ? parseInt(formData.get("armorClass") as string) : undefined,
                speed: formData.get("speed") ? parseInt(formData.get("speed") as string) : undefined,
                initiative: formData.get("initiative") ? parseInt(formData.get("initiative") as string) : undefined,
                attributes: formData.get("str") ? stringifyAttributes({
                    str: parseInt(formData.get("str") as string) || 10,
                    dex: parseInt(formData.get("dex") as string) || 10,
                    con: parseInt(formData.get("con") as string) || 10,
                    int: parseInt(formData.get("int") as string) || 10,
                    wis: parseInt(formData.get("wis") as string) || 10,
                    cha: parseInt(formData.get("cha") as string) || 10,
                }) : undefined,
            }
        });

        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');
        return character;
    });
}

export async function deleteCharacter(characterId: string): Promise<ActionResult> {
    return actionWrapper("deleteCharacter", async () => {
        if (!characterId) throw new Error("Character ID is required");

        const character = await prisma.character.delete({
            where: { id: characterId }
        });

        await logAction(character.campaignId, `**${character.name}** has been removed.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');
        return character;
    });
}

// --- Conditions Management ---

export async function updateConditions(characterId: string, conditions: string[]): Promise<ActionResult> {
    return actionWrapper("updateConditions", async () => {
        if (!characterId) throw new Error("Character ID is required");

        const character = await prisma.character.update({
            where: { id: characterId },
            data: { conditions: stringifyConditions(conditions) }
        });

        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');
        return character;
    });
}

// --- Inventory Management ---

export async function addInventoryItem(characterId: string, item: string): Promise<ActionResult> {
    return actionWrapper("addInventoryItem", async () => {
        if (!characterId) throw new Error("Character ID is required");
        if (!item || !item.trim()) throw new Error("Item name is required");

        const character = await prisma.character.findUnique({ where: { id: characterId } });
        if (!character) throw new Error("Character not found");

        const inventory = parseInventory(character.inventory);
        inventory.push(item.trim());

        const updated = await prisma.character.update({
            where: { id: characterId },
            data: { inventory: stringifyInventory(inventory) }
        });

        await logAction(character.campaignId, `**${character.name}** receives **${item.trim()}**.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/player');
        return updated;
    });
}

export async function removeInventoryItem(characterId: string, item: string): Promise<ActionResult> {
    return actionWrapper("removeInventoryItem", async () => {
        if (!characterId) throw new Error("Character ID is required");

        const character = await prisma.character.findUnique({ where: { id: characterId } });
        if (!character) throw new Error("Character not found");

        const inventory = parseInventory(character.inventory);
        const idx = inventory.indexOf(item);
        if (idx !== -1) inventory.splice(idx, 1);

        const updated = await prisma.character.update({
            where: { id: characterId },
            data: { inventory: stringifyInventory(inventory) }
        });

        await logAction(character.campaignId, `**${character.name}** loses **${item}**.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/player');
        return updated;
    });
}

// --- Library Management ---

export async function getAvailableCharacters(): Promise<ActionResult> {
    return actionWrapper("getAvailableCharacters", async () => {
        const characters = await prisma.character.findMany({
            orderBy: { name: 'asc' }
        });
        return characters;
    });
}
