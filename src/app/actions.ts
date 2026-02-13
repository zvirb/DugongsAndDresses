'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { actionWrapper, ActionResult } from "@/lib/actions-utils";
import { stringifyAttributes, stringifyConditions, parseInventory, stringifyInventory, parseConditions, extractAttributesFromFormData, stringifyParticipants, parseParticipants, parseCharacterInputs } from "@/lib/safe-json";
import { mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import { createBackup, restoreBackup, listBackups, deleteBackup, checkAutoBackup } from "@/lib/backup";
import { generateStory } from "@/lib/ai";
import { z } from "zod";
import { CharacterInput, CharacterInputSchema, Participants } from "@/lib/schemas";
import { Character, Settings } from "@prisma/client";

export async function createCampaign(formData: FormData): Promise<ActionResult> {
    return actionWrapper("createCampaign", async () => {
        const name = formData.get("name") as string;
        if (!name || name.trim().length === 0) {
            throw new Error("Campaign name is required");
        }

        const charactersJson = formData.get("characters") as string;
        const characters = parseCharacterInputs(charactersJson);

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

        await logAction(campaign.id, `The world of **${campaign.name}** manifests.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/public');
        return campaign;
    });
}

// BARD'S JOURNAL - CRITICAL LEARNINGS ONLY:
// Format: ## YYYY-MM-DD - [Log] Boring: [Log said "HP Update"] Song: [Changed to "Grom takes 5 damage"]

export async function logAction(campaignId: string, content: string, type: string = "Story"): Promise<ActionResult> {
    return actionWrapper("logAction", async () => {
        if (!campaignId) throw new Error("Campaign ID is required");
        if (!content) throw new Error("Content is required");

        const entry = await prisma.logEntry.create({ data: { campaignId, content, type } });

        // Fire-and-forget auto-backup check
        checkAutoBackup().catch(err => console.error("Auto-backup error:", err));

        // Fire-and-forget AI story generation
        if (type !== 'AI' && (type === 'Combat' || type === 'Story')) {
            generateStory(campaignId).catch(err => console.error("Story Gen error:", err));
        }

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
                content = `**${character.name}** rallies, reclaiming **${amount}** vitality.`;
            } else {
                content = `**${character.name}** suffers **${amount}** damage.`;
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

export async function duplicateCharacter(characterId: string): Promise<ActionResult> {
    return actionWrapper("duplicateCharacter", async () => {
        if (!characterId) throw new Error("Character ID is required");

        const source = await prisma.character.findUnique({ where: { id: characterId } });
        if (!source) throw new Error("Character not found");

        const newChar = await prisma.character.create({
            data: {
                campaignId: source.campaignId,
                name: `${source.name} (Copy)`,
                type: source.type,
                race: source.race,
                class: source.class,
                level: source.level,
                hp: source.hp,
                maxHp: source.maxHp,
                armorClass: source.armorClass,
                speed: source.speed,
                initiative: source.initiative,
                attributes: source.attributes,
                inventory: source.inventory,
                conditions: source.conditions,
                imageUrl: source.imageUrl,
                initiativeRoll: 0,
                // If source has a sourceId, use it (it's a clone). If not, use its own ID (it's the original).
                sourceId: source.sourceId || source.id
            }
        });

        await logAction(source.campaignId, `**${newChar.name}** joins the ranks.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');
        return newChar;
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

        const content = `**${character.name}** seizes the moment with initiative: **${roll}**.`;
        await logAction(character.campaignId, content, "Combat");

        revalidatePath('/dm');
        return character;
    });
}

// SENTRY'S JOURNAL - CRITICAL LEARNINGS ONLY:
// Format: ## YYYY-MM-DD - [Logic] Break: [Turn skipped index 0] Fix: [Corrected modulo arithmetic]
// ## 2024-05-20 - [Logic] Break: [Double turn skip] Fix: [Idempotency check with expectedActiveId]
// ## 2024-05-21 - [Logic] Break: [Empty campaign crash] Fix: [Validation for empty characters array]
// ## 2024-05-22 - [Logic] Break: [Stale client state causes confusion] Fix: [Detect and log mismatch when DB has no active char but client expects one]
// ## 2024-05-23 - [Logic] Audit: [Race conditions & Sorting] Fix: [Verified Idempotency check returns actual active char; verified DB sort order matches UI]

export async function advanceTurn(campaignId: string, expectedActiveId?: string): Promise<ActionResult> {
    return actionWrapper("advanceTurn", async () => {
        // Validation
        if (!campaignId || typeof campaignId !== 'string' || campaignId.trim().length === 0) {
            throw new Error("Invalid campaign ID");
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
            console.error(`[SENTRY] AdvanceTurn failed: No characters found in campaign ${campaignId}`);
            throw new Error("No characters in campaign");
        }

        const currentIndex = characters.findIndex(c => c.activeTurn);

        // --- SENTRY'S GUARD: RACE CONDITION CHECK (Idempotency) ---
        // Ensure that we are advancing from the state the client *thinks* it is in.
        // If the client expects 'Alice' to be active, but the DB says 'Bob' is active,
        // it means another DM (or process) already advanced the turn.
        // ACTION: Return the ACTUAL active character (Bob) to sync the client, do NOT advance again.
        if (currentIndex !== -1) {
            const currentActive = characters[currentIndex];
            // If expectedActiveId is undefined (Client thinks start of combat) but someone is active,
            // OR if expectedActiveId mismatches the DB active character, return the actual active one.
            if (!expectedActiveId || currentActive.id !== expectedActiveId) {
                console.warn(`[SENTRY] Race Condition Detected in Campaign ${campaignId}. Client expected active: ${expectedActiveId || 'None'}, DB has: ${currentActive.id}. Syncing client to DB state.`);
                const actualActive = await prisma.character.findUnique({ where: { id: currentActive.id } });
                return actualActive;
            }
        } else if (expectedActiveId) {
            // SENTRY: Client thinks someone is active, but DB says NO ONE is active.
            // This implies a manual reset or deletion occurred. We must restart at 0.
            console.warn(`[SENTRY] Race Condition: Client expects active character ${expectedActiveId}, but DB has none. Resetting to start.`);
        }

        // --- SENTRY'S LOOP SAFETY ---
        // Uses modulo arithmetic to ensure the turn cycles back to the first character (index 0)
        // when the last character finishes their turn.
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

        await logAction(campaignId, `The spotlight falls upon **${newActiveChar.name}**.`, "Combat");

        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');

        return newActiveChar;
    });
}

export async function activateCampaign(campaignId: string): Promise<ActionResult> {
    return actionWrapper("activateCampaign", async () => {
        if (!campaignId) throw new Error("Campaign ID is required");

        // PERFORMANCE: Only update active campaigns to avoid scanning all records
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

        const uploadDir = join(process.cwd(), 'public/avatars');
        await mkdir(uploadDir, { recursive: true });

        const filename = `${characterId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const path = join(uploadDir, filename);

        const stream = file.stream();
        // Convert the web stream to a node stream for piping to fs
        // Cast to 'any' to avoid strict type checks between web ReadableStream and node Readable
        // Using Readable.from is more robust as it accepts any AsyncIterable, including Web Streams
        const nodeStream = Readable.from(stream as any);
        const writeStream = createWriteStream(path);

        await pipeline(nodeStream, writeStream);

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
                attributes: stringifyAttributes(extractAttributesFromFormData(formData)),
                initiativeRoll: 0,
            }
        });

        await logAction(campaignId, `**${character.name}** enters the fray.`, "Story");

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
                attributes: formData.get("str") ? stringifyAttributes(extractAttributesFromFormData(formData)) : undefined,
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

        await logAction(character.campaignId, `**${character.name}** has fallen.`, "Story");

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

export async function deleteEncounter(encounterId: string): Promise<ActionResult> {
    return actionWrapper("deleteEncounter", async () => {
        if (!encounterId) throw new Error("Encounter ID is required");

        await prisma.encounter.delete({
            where: { id: encounterId }
        });

        revalidatePath('/dm');
        return { success: true };
    });
}

export async function deleteBackupAction(filename: string): Promise<ActionResult> {
    return actionWrapper("deleteBackup", async () => {
        await deleteBackup(filename);
        // No path to revalidate as the list is client-side fetched in BackupManager,
        // but revalidating DM page just in case.
        revalidatePath('/dm');
        return { success: true };
    });
}

// --- Settings Management ---

export async function getSettings(): Promise<ActionResult<Settings>> {
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

export async function saveEncounter(campaignId: string, participants: Participants): Promise<ActionResult> {
    return actionWrapper("saveEncounter", async () => {
        if (!campaignId) throw new Error("Campaign ID is required");

        const encounter = await prisma.encounter.create({
            data: {
                campaignId,
                name: `Encounter ${new Date().toLocaleString()}`,
                status: "Active",
                participants: stringifyParticipants(participants)
            }
        });

        revalidatePath('/dm');
        return encounter;
    });
}

// --- Quick Actions ---

export async function performAttack(attackerId: string, targetId: string, damage: number, attackRoll?: number): Promise<ActionResult> {
    return actionWrapper("performAttack", async () => {
        if (!attackerId || !targetId) throw new Error("Attacker and Target IDs are required");

        const attacker = await prisma.character.findUnique({ where: { id: attackerId } });
        const target = await prisma.character.findUnique({ where: { id: targetId } });

        if (!attacker || !target) throw new Error("Character not found");

        let content = "";
        let isHit = true;
        let isCrit = false;
        let isFumble = false;

        if (attackRoll !== undefined) {
            if (attackRoll === 20) {
                isHit = true;
                isCrit = true;
            } else if (attackRoll === 1) {
                isHit = false;
                isFumble = true;
            } else if (target.armorClass && attackRoll < target.armorClass) {
                isHit = false;
            }
        } else {
            // If no roll provided, assume miss if 0 damage
            if (damage <= 0) isHit = false;
        }

        if (isCrit) {
            content = `A natural 20! **${attacker.name}** executes a **CRITICAL HIT** upon **${target.name}**`;
        } else if (isFumble) {
            content = `Disaster strikes! **${attacker.name}** suffers a **CRITICAL MISS** against **${target.name}**!`;
        } else if (isHit) {
            content = `**${attacker.name}** strikes **${target.name}**`;
        } else {
            content = `**${attacker.name}** attacks **${target.name}**`;
        }

        if (attackRoll !== undefined) {
             content += ` (Roll: **${attackRoll}**)`;
        }

        let updatedTarget = target;

        if (isHit) {
            if (damage > 0) {
                content += `, dealing **${damage}** damage!`;
                updatedTarget = await prisma.character.update({
                    where: { id: targetId },
                    data: { hp: { decrement: damage } }
                });
                await syncToSource(updatedTarget);
            } else {
                content += ` but deals no damage!`;
            }
        } else {
            if (!isFumble) {
                content += ` but finds no purchase!`;
            }
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

        let content = `**${character.name}** attempts a check of **${skillName}**`;

        if (dc) {
            content += ` against DC **${dc}**`;
        }

        if (roll !== undefined) {
             if (dc) {
                 if (roll >= dc) {
                     content += `: **SUCCESS**`;
                 } else {
                     content += `: **FAILURE**`;
                 }
             }
             content += ` (Roll: **${roll}**)`;
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

        let content = `**${caster.name}** invokes **${spellName}**`;
        if (targetName) {
            content += ` targeting **${targetName}**`;
        }

        if (condition && target) {
            content += `, imposing **${condition}**`;

            const currentConditions = parseConditions(target.conditions);
            if (!currentConditions.includes(condition)) {
                currentConditions.push(condition);
                const updatedTarget = await prisma.character.update({
                    where: { id: target.id },
                    data: { conditions: stringifyConditions(currentConditions) }
                });
                await syncToSource(updatedTarget);
            }
        }

        content += `!`;

        await logAction(caster.campaignId, content, "Combat");

        revalidatePath('/dm');
        revalidatePath('/player');
        return { success: true };
    });
}

export async function updateSettings(formData: FormData): Promise<ActionResult<Settings>> {
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

export async function listEncounters(campaignId: string): Promise<ActionResult> {
    return actionWrapper("listEncounters", async () => {
        if (!campaignId) throw new Error("Campaign ID is required");

        const encounters = await prisma.encounter.findMany({
            where: { campaignId },
            orderBy: { createdAt: 'desc' }
        });
        return encounters;
    });
}

export async function loadEncounter(encounterId: string): Promise<ActionResult> {
    return actionWrapper("loadEncounter", async () => {
        if (!encounterId) throw new Error("Encounter ID is required");

        const encounter = await prisma.encounter.findUnique({ where: { id: encounterId } });
        if (!encounter) throw new Error("Encounter not found");

        const participants = parseParticipants(encounter.participants);

        // Reset active turn for all characters first
        await prisma.character.updateMany({
            where: { campaignId: encounter.campaignId },
            data: { activeTurn: false }
        });

        // Update each character's initiative roll
        for (const p of participants) {
            await prisma.character.update({
                where: { id: p.characterId },
                data: { initiativeRoll: p.initiative }
            });
        }

        await logAction(encounter.campaignId, `The stage is set for **${encounter.name}**.`, "Combat");

        revalidatePath('/dm');
        return { success: true };
    });
}

export async function endEncounter(campaignId: string): Promise<ActionResult> {
    return actionWrapper("endEncounter", async () => {
        if (!campaignId) throw new Error("Campaign ID is required");

        await prisma.character.updateMany({
            where: { campaignId },
            data: {
                initiativeRoll: 0,
                activeTurn: false
            }
        });

        await logAction(campaignId, `Combat ends. The dust settles.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/player');
        return { success: true };
    });
}

export async function importCharacterFromLibrary(campaignId: string, libraryCharacterId: string): Promise<ActionResult> {
    return actionWrapper("importCharacterFromLibrary", async () => {
        if (!campaignId || !libraryCharacterId) throw new Error("Campaign ID and Library Character ID are required");

        const source = await prisma.character.findUnique({ where: { id: libraryCharacterId } });
        if (!source) throw new Error("Source character not found");

        const newChar = await prisma.character.create({
            data: {
                campaignId,
                name: source.name,
                type: source.type,
                race: source.race,
                class: source.class,
                level: source.level,
                hp: source.hp,
                maxHp: source.maxHp,
                armorClass: source.armorClass,
                speed: source.speed,
                initiative: source.initiative,
                attributes: source.attributes,
                inventory: source.inventory,
                conditions: "[]",
                initiativeRoll: 0,
                sourceId: source.id // Link to source for future sync if needed
            }
        });

        await logAction(campaignId, `**${newChar.name}** emerges from the archives.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/player');
        return newChar;
    });
}
