'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { actionWrapper, ActionResult } from "@/lib/actions-utils";
import { stringifyAttributes, stringifyConditions, parseInventory, stringifyInventory, parseConditions } from "@/lib/safe-json";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createBackup, restoreBackup, listBackups } from "@/lib/backup";
import { z } from "zod";
import { CharacterInput, CharacterInputSchema } from "@/lib/schemas";
import { Character } from "@prisma/client";

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
                const result = z.array(CharacterInputSchema).safeParse(parsed);
                if (result.success) {
                    characters = result.data;
                } else {
                    console.error("Characters validation failed:", result.error);
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
                            sourceId: c.sourceId || null
                        }))
                    }
                } : {})
            }
        });

        await logAction(campaign.id, `The world of **${campaign.name}** is born.`, "Story");

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
            const amount = Math.abs(delta);
            let content = "";
            if (delta > 0) {
                content = `**${character.name}** rallies, recovering **${amount}** HP.`;
            } else {
                content = `**${character.name}** is struck, taking **${amount}** damage.`;
            }
            await logAction(character.campaignId, content, "Combat");
        }

        await syncToSource(character);

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

        // We probably don't need to sync Initiative Roll to library, as it's combat specific
        // but maybe the user wants to keep the last roll?
        // Let's NOT sync initiative roll to source as it's ephemeral.

        const content = `**${character.name}** prepares for battle with an initiative of **${roll}**.`;
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
        if (currentIndex !== -1) {
            const currentActive = characters[currentIndex];
            // If expectedActiveId is undefined (Client thinks start of combat) but someone is active,
            // OR if expectedActiveId mismatches the DB active character, return the actual active one.
            if (!expectedActiveId || currentActive.id !== expectedActiveId) {
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

        await logAction(campaignId, `It is now **${newActiveChar.name}**'s turn.`, "Combat");

        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');

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

        const content = `The saga of **${campaign.name}** resumes.`;
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

        const content = `**${character.name}** reveals a new guise.`;
        await logAction(character.campaignId, content, "Story");

        revalidatePath('/public');
        revalidatePath('/dm');
        return character;
    });
}

// Very basic file upload handler (Local FS only)
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

        await logAction(campaignId, `A new challenger approaches: **${character.name}** joins the party.`, "Story");

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

        await syncToSource(character);

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

        await logAction(character.campaignId, `**${character.name}** has vanished from existence.`, "Story");

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

        await syncToSource(character);

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

        // Sync to Library
        await syncToSource(updated);

        await logAction(character.campaignId, `**${character.name}** acquires **${item.trim()}**.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/player');
        return updated;
    });
}

async function syncToSource(character: Character) {
    if (character.sourceId) {
        try {
            await prisma.character.update({
                where: { id: character.sourceId },
                data: {
                    hp: character.hp,
                    maxHp: character.maxHp,
                    armorClass: character.armorClass,
                    level: character.level,
                    speed: character.speed,
                    attributes: character.attributes,
                    inventory: character.inventory,
                    class: character.class,
                    race: character.race,
                }
            });
        } catch (e) {
            console.error("Failed to sync to source:", e);
        }
    }
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

        // Sync Source
        await syncToSource(updated);

        await logAction(character.campaignId, `**${character.name}** discards **${item}**.`, "Story");

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

// --- Backup Management ---

export async function createBackupAction(): Promise<ActionResult> {
    return actionWrapper("createBackup", async () => {
        const filename = await createBackup();
        revalidatePath('/dm');
        return { filename };
    });
}

export async function listBackupsAction(): Promise<ActionResult> {
    return actionWrapper("listBackups", async () => {
        return listBackups();
    });
}

export async function restoreBackupAction(filename: string): Promise<ActionResult> {
    return actionWrapper("restoreBackup", async () => {
        await restoreBackup(filename);
        revalidatePath('/');
        return { success: true };
    });
}

// --- Settings Management ---

export async function getSettings(): Promise<ActionResult> {
    return actionWrapper("getSettings", async () => {
        let settings = await prisma.settings.findFirst();
        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    ollamaModel: "llama3",
                    enableStoryGen: false,
                    autoBackup: true,
                    backupCount: 10
                }
            });
        }
        return settings;
    });
}

// --- Quick Actions ---

export async function performAttack(attackerId: string, targetId: string, damage: number, attackRoll?: number): Promise<ActionResult> {
    return actionWrapper("performAttack", async () => {
        if (!attackerId || !targetId) throw new Error("Attacker and Target IDs are required");

        const attacker = await prisma.character.findUnique({ where: { id: attackerId } });
        const target = await prisma.character.findUnique({ where: { id: targetId } });

        if (!attacker || !target) throw new Error("Character not found");

        let content = `**${attacker.name}** attacks **${target.name}**`;
        if (attackRoll) {
            content += ` (Roll: **${attackRoll}**)`;
        }

        let updatedTarget = target;

        if (damage > 0) {
            content += ` and hits for **${damage}** damage!`;
            updatedTarget = await prisma.character.update({
                where: { id: targetId },
                data: { hp: { decrement: damage } }
            });
            await syncToSource(updatedTarget);
        } else {
            content += `!`;
        }

        await logAction(attacker.campaignId, content, "Combat");

        revalidatePath('/dm');
        revalidatePath('/player');
        return updatedTarget;
    });
}

export async function performSkillCheck(characterId: string, skillName: string, dc?: number, roll?: number): Promise<ActionResult> {
    return actionWrapper("performSkillCheck", async () => {
        if (!characterId) throw new Error("Character ID is required");
        if (!skillName) throw new Error("Skill name is required");

        const character = await prisma.character.findUnique({ where: { id: characterId } });
        if (!character) throw new Error("Character not found");

        let content = `**${character.name}** checks **${skillName}**`;

        if (dc) {
            content += ` (DC ${dc})`;
        }

        if (roll !== undefined) {
             content += ` — rolled **${roll}**`;
             if (dc) {
                 if (roll >= dc) {
                     content += ` (SUCCESS)`;
                 } else {
                     content += ` (FAILURE)`;
                 }
             }
        }

        await logAction(character.campaignId, content + ".", "Roll");
        return { success: true };
    });
}

export async function castSpell(casterId: string, targetId: string | undefined, spellName: string, condition?: string): Promise<ActionResult> {
    return actionWrapper("castSpell", async () => {
        if (!casterId || !spellName) throw new Error("Caster and Spell Name are required");

        const caster = await prisma.character.findUnique({ where: { id: casterId } });
        if (!caster) throw new Error("Caster not found");

        let targetName = "";
        let target = null;

        if (targetId) {
            target = await prisma.character.findUnique({ where: { id: targetId } });
            if (target) targetName = target.name;
        }

        let content = `**${caster.name}** casts **${spellName}**`;
        if (targetName) {
            content += ` on **${targetName}**`;
        }

        if (condition && target) {
            content += ` applying **${condition}**!`;

            const currentConditions = parseConditions(target.conditions);
            if (!currentConditions.includes(condition)) {
                currentConditions.push(condition);
                const updatedTarget = await prisma.character.update({
                    where: { id: target.id },
                    data: { conditions: stringifyConditions(currentConditions) }
                });
                await syncToSource(updatedTarget);
            }
        } else {
            content += `!`;
        }

        await logAction(caster.campaignId, content, "Combat");

        revalidatePath('/dm');
        revalidatePath('/player');
        return { success: true };
    });
}

export async function updateSettings(formData: FormData): Promise<ActionResult> {
    return actionWrapper("updateSettings", async () => {
        const ollamaModel = formData.get("ollamaModel") as string;
        const enableStoryGen = formData.get("enableStoryGen") === "on";
        const autoBackup = formData.get("autoBackup") === "on";
        const backupCount = parseInt(formData.get("backupCount") as string) || 10;

        // Since we only have one settings record, we find first and update it, or create if missing
        let settings = await prisma.settings.findFirst();

        if (settings) {
            settings = await prisma.settings.update({
                where: { id: settings.id },
                data: {
                    ollamaModel,
                    enableStoryGen,
                    autoBackup,
                    backupCount
                }
            });
        } else {
            settings = await prisma.settings.create({
                data: {
                    ollamaModel,
                    enableStoryGen,
                    autoBackup,
                    backupCount
                }
            });
        }

        revalidatePath('/settings');
        revalidatePath('/dm');
        return settings;
    });
}
