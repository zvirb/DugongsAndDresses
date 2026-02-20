'use server'

import { prisma } from "@/lib/prisma";
import { getLibraryCharacters, getEncounters } from "@/lib/queries";
import { revalidatePath } from "next/cache";
import { actionWrapper, ActionResult } from "@/lib/actions-utils";
import { stringifyAttributes, parseAttributes, stringifyConditions, parseInventory, stringifyInventory, parseConditions, extractAttributesFromFormData, stringifyParticipants, parseParticipants, parseCharacterInputs, parseCharacterForm, createDefaultAttributes, parseSettingsForm } from "@/lib/safe-json";
import { mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import { createBackup, restoreBackup, listBackups, deleteBackup, checkAutoBackup } from "@/lib/backup";
import { generateStory } from "@/lib/ai";
import { z } from "zod";
import { CharacterInput, CharacterInputSchema, Participants, LogTypeSchema, AttackActionSchema, SkillCheckActionSchema, SpellCastActionSchema } from "@/lib/schemas";
import { Character, Settings } from "@prisma/client";

// BARD'S JOURNAL - CRITICAL LEARNINGS ONLY:
// Format: ## YYYY-MM-DD - [Log] Boring: [Log said "HP Update"] Song: [Changed to "Grom takes 5 damage"]
// ## 2025-05-24 - [Log] Boring: [Generic "Attacks", "Creates"] Song: [Enhanced with "CRITICAL HIT!", "Manifests", "Unconscious"]
// ## 2025-05-25 - [Log] Boring: [Generic "Casts", "Checks"] Song: [Enhanced with "The air shimmers", "The attempt succeeds"]
// ## 2025-05-26 - [Log] Boring: [Generic "Attacks", "Hits"] Song: [Enhanced with "Strikes", "Devastating blow", "The blow goes wide"]

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

        await logAction(campaign.id, `The world of **${campaign.name}** awakens. A new saga begins.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/public');
        return campaign;
    });
}

export async function logAction(campaignId: string, content: string, type: string = "Story"): Promise<ActionResult> {
    return actionWrapper("logAction", async () => {
        if (!campaignId) throw new Error("Campaign ID is required");
        if (!content) throw new Error("Content is required");

        // Validate Log Type
        const validType = LogTypeSchema.safeParse(type);
        const finalType = validType.success ? validType.data : "Story";
        if (!validType.success) console.warn(`[Quartermaster] Invalid log type '${type}' defaulted to 'Story'.`);

        // Sanitize Content
        // Limit length to prevent database abuse, but allow reasonable story length
        let sanitizedContent = content.trim();
        if (sanitizedContent.length > 1000) {
            sanitizedContent = sanitizedContent.substring(0, 1000) + "... (truncated)";
        }

        const entry = await prisma.logEntry.create({ data: { campaignId, content: sanitizedContent, type: finalType } });

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
                content = `**${character.name}** catches their breath, surging with **${amount}** renewed vitality.`;
            } else {
                content = `**${character.name}** staggers under the assault, suffering **${amount}** damage`;
                if (character.hp <= 0) {
                    content += ` and collapses, their vision fading to black. They are **UNCONSCIOUS**!`;
                } else {
                    content += `.`;
                }
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

export async function performLongRest(characterId: string): Promise<ActionResult> {
    return actionWrapper("performLongRest", async () => {
        if (!characterId) throw new Error("Character ID is required");

        const character = await prisma.character.findUnique({ where: { id: characterId } });
        if (!character) throw new Error("Character not found");

        const updated = await prisma.character.update({
            where: { id: characterId },
            data: {
                hp: character.maxHp,
                conditions: "[]"
            }
        });

        await syncToSource(updated);

        await logAction(character.campaignId, `**${character.name}** settles in for a long rest. Wounds are bound, spirits lifted, and all ailments are washed away. They are fully restored.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/player');
        revalidatePath('/public');
        return updated;
    });
}

export async function performDodge(characterId: string): Promise<ActionResult> {
    return actionWrapper("performDodge", async () => {
        if (!characterId) throw new Error("Character ID is required");

        const character = await prisma.character.findUnique({ where: { id: characterId } });
        if (!character) throw new Error("Character not found");

        const currentConditions = parseConditions(character.conditions);
        if (!currentConditions.includes("Dodging")) {
            currentConditions.push("Dodging");
            await prisma.character.update({
                where: { id: characterId },
                data: { conditions: stringifyConditions(currentConditions) }
            });
            // We generally sync state changes
            await syncToSource(character);
        }

        await logAction(character.campaignId, `**${character.name}** takes a defensive stance, ready to dodge incoming attacks.`, "PlayerAction");

        revalidatePath('/dm');
        revalidatePath('/player');
        revalidatePath('/public');
        return { success: true };
    });
}

export async function performDash(characterId: string): Promise<ActionResult> {
    return actionWrapper("performDash", async () => {
        if (!characterId) throw new Error("Character ID is required");

        const character = await prisma.character.findUnique({ where: { id: characterId } });
        if (!character) throw new Error("Character not found");

        const currentConditions = parseConditions(character.conditions);
        if (!currentConditions.includes("Dashing")) {
            currentConditions.push("Dashing");
            await prisma.character.update({
                where: { id: characterId },
                data: { conditions: stringifyConditions(currentConditions) }
            });
            await syncToSource(character);
        }

        await logAction(character.campaignId, `**${character.name}** dashes with a burst of speed!`, "PlayerAction");

        revalidatePath('/dm');
        revalidatePath('/player');
        revalidatePath('/public');
        return { success: true };
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
                attributes: stringifyAttributes(parseAttributes(source.attributes)),
                inventory: stringifyInventory(parseInventory(source.inventory)),
                conditions: stringifyConditions(parseConditions(source.conditions)),
                imageUrl: source.imageUrl,
                initiativeRoll: 0,
                // If source has a sourceId, use it (it's a clone). If not, use its own ID (it's the original).
                sourceId: source.sourceId || source.id
            }
        });

        await logAction(source.campaignId, `**${source.name}** splits! A doppelgänger, **${newChar.name}**, emerges from the shadows.`, "Story");

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

        const content = `**${character.name}** prepares for battle! Initiative: **${roll}**.`;
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
// ## 2025-05-24 - [Logic] Fortify: [Turn Loop Integrity] Fix: [Verified loop safety and race condition logging]
// ## 2025-05-24 - [Logic] Fortify: [Defensive Coding] Fix: [Added explicit nextCharId check before transaction]
// ## 2025-05-25 - [Logic] Fortify: [Race Condition Safety] Fix: [Verified Idempotency logic and Sync-on-Stale behavior in unit tests]
// ## 2025-05-26 - [Logic] Fortify: [Turn Loop & Recovery] Fix: [Verified loop safety (last->first) and state recovery in new test suite]
// ## 2025-05-31 - [Logic] Fortify: [Multiple Active Turns] Fix: [Added detection and auto-recovery logging]

export async function advanceTurn(campaignId: string, expectedActiveId?: string): Promise<ActionResult> {
    return actionWrapper("advanceTurn", async () => {
        return internalAdvanceTurn(campaignId, expectedActiveId, 0);
    });
}

// Internal recursive function without actionWrapper to prevent nested results
async function internalAdvanceTurn(campaignId: string, expectedActiveId?: string, retryCount: number = 0): Promise<any> {
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

    // SENTRY: Audit for multiple active turns (Data Integrity)
    const activeCount = characters.filter(c => c.activeTurn).length;
    if (activeCount > 1) {
        console.warn(`[SENTRY] Data Integrity Warning: Multiple active characters (${activeCount}) found in campaign ${campaignId}. Auto-correcting...`);
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

    // SENTRY: Log loop event
    if (currentIndex !== -1 && nextIndex === 0 && characters.length > 1) {
        console.info(`[SENTRY] Turn Cycle Complete. Looping to start for Campaign ${campaignId}.`);
    }

    const nextCharId = characters[nextIndex]?.id;

    if (!nextCharId) {
        throw new Error(`[SENTRY] Critical Failure: Unable to determine next character ID (Index: ${nextIndex}, Total: ${characters.length})`);
    }

    let newActiveChar;
    try {
        const result = await prisma.$transaction([
            prisma.character.updateMany({
                where: { campaignId, activeTurn: true },
                data: { activeTurn: false }
            }),
            prisma.character.update({
                where: { id: nextCharId },
                data: { activeTurn: true }
            })
        ]);
        newActiveChar = result[1];
    } catch (error: any) {
        if (error.code === 'P2025' || error.message?.includes('Record to update not found')) {
            if (retryCount < 3) {
                console.warn(`[SENTRY] Race Condition: Next character ${nextCharId} not found (likely deleted). Retrying attempt ${retryCount + 1}...`);
                // Recursively try again - this will re-fetch the list (minus the deleted char) and find the NEW next char
                // We pass expectedActiveId to maintain the original intent, but if the active char was deleted,
                // the recursive call will handle the "No active char" state gracefully.
                return internalAdvanceTurn(campaignId, expectedActiveId, retryCount + 1);
            } else {
                console.error(`[SENTRY] Critical Failure: Max retries reached for campaign ${campaignId}.`);
                throw new Error("Combatant vanished! The next character cannot be found even after retrying.");
            }
        }
        throw error;
    }

    await logAction(campaignId, `The spotlight turns to **${newActiveChar.name}**. It is their moment to act.`, "Combat");

    revalidatePath('/dm');
    revalidatePath('/public');
    revalidatePath('/player');

    return newActiveChar;
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

        const content = `**${character.name}** reveals a new appearance.`;
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
        if (!campaignId) throw new Error("Campaign ID is required");

        const charData = parseCharacterForm(formData, false);
        if (!charData.name) throw new Error("Character name is required");

        const character = await prisma.character.create({
            data: {
                campaignId,
                name: charData.name,
                type: charData.type || "PLAYER",
                race: charData.race || null,
                class: charData.class || null,
                level: charData.level || 1,
                hp: charData.hp || 10,
                maxHp: charData.maxHp || 10,
                armorClass: charData.armorClass || 10,
                speed: charData.speed || 30,
                initiative: charData.initiative || 0,
                attributes: stringifyAttributes({ ...createDefaultAttributes(), ...(charData.attributes || {}) } as any),
                initiativeRoll: 0,
                sourceId: charData.sourceId || null
            }
        });

        await logAction(campaignId, `A new soul, **${character.name}**, enters the fray!`, "Story");

        revalidatePath('/dm');
        revalidatePath('/public');
        revalidatePath('/player');
        return character;
    });
}

export async function updateCharacter(characterId: string, formData: FormData): Promise<ActionResult> {
    return actionWrapper("updateCharacter", async () => {
        if (!characterId) throw new Error("Character ID is required");

        // Fetch existing character to preserve attributes not in the form
        const existing = await prisma.character.findUnique({ where: { id: characterId } });
        if (!existing) throw new Error("Character not found");

        const charData = parseCharacterForm(formData, true);

        // Merge existing attributes with new ones
        let finalAttributes = undefined;
        if (charData.attributes) {
            const existingAttributes = parseAttributes(existing.attributes);
            finalAttributes = stringifyAttributes({ ...existingAttributes, ...charData.attributes } as any);
        }

        const character = await prisma.character.update({
            where: { id: characterId },
            data: {
                name: charData.name,
                type: charData.type,
                race: charData.race,
                class: charData.class,
                level: charData.level,
                hp: charData.hp,
                maxHp: charData.maxHp,
                armorClass: charData.armorClass,
                speed: charData.speed,
                initiative: charData.initiative,
                attributes: finalAttributes,
            }
        });

        await syncToSource(character);

        let content = `**${character.name}** undergoes a transformation.`;

        if (charData.level && charData.level > existing.level) {
            content = `**${character.name}** ascends! Reaches Level **${charData.level}**.`;
        } else if (charData.name && charData.name !== existing.name) {
            content = `**${existing.name}** is now known as **${charData.name}**.`;
        } else if ((charData.race && charData.race !== existing.race) || (charData.class && charData.class !== existing.class)) {
            content = `**${character.name}** is reborn as a **${character.race}** **${character.class}**.`;
        }

        await logAction(character.campaignId, content, "Story");

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

        await logAction(character.campaignId, `**${character.name}** has fallen from the annals of history. They are gone.`, "Story");

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

        await logAction(character.campaignId, `**${character.name}** acquires **${item.trim()}**, adding it to their inventory.`, "Story");

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

        await logAction(character.campaignId, `**${character.name}** discards **${item}**, leaving it behind.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/player');
        return updated;
    });
}

// --- Library Management ---

export async function getAvailableCharacters(): Promise<ActionResult> {
    return actionWrapper("getAvailableCharacters", async () => {
        return getLibraryCharacters();
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

export async function performAttack(attackerId: string, targetId: string | undefined, damage: number | undefined, attackRoll?: number): Promise<ActionResult> {
    return actionWrapper("performAttack", async () => {
        // Quartermaster: Cleanse Inputs
        const validated = AttackActionSchema.parse({ attackerId, targetId, damage, attackRoll });

        const attacker = await prisma.character.findUnique({ where: { id: validated.attackerId } });
        if (!attacker) throw new Error("Attacker not found");

        let target = null;
        if (validated.targetId) {
            target = await prisma.character.findUnique({ where: { id: validated.targetId } });
            if (!target) throw new Error("Target not found");
        }

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
            } else if (target && target.armorClass && attackRoll < target.armorClass) {
                isHit = false;
            }
        } else {
            // If no roll provided, if damage is provided we assume manual hit.
            // If no damage is provided and no roll, it's just flavor text (hit without damage).
        }

        let content = "";

        if (target) {
             if (isCrit) {
                content = `**CRITICAL HIT**! **${attacker.name}** finds a weak point and strikes **${target.name}** with deadly precision!`;
             } else if (isFumble) {
                content = `**CRITICAL MISS**! **${attacker.name}** loses their footing and fails to strike **${target.name}**!`;
             } else if (isHit) {
                content = `**${attacker.name}** strikes **${target.name}**!`;
             } else {
                content = `**${attacker.name}** attacks **${target.name}**, but the blow is deflected.`;
             }
        } else {
             if (isCrit) {
                content = `**CRITICAL HIT**! **${attacker.name}** unleashes a devastating attack!`;
             } else if (isFumble) {
                content = `**CRITICAL MISS**! **${attacker.name}** stumbles!`;
             } else {
                content = `**${attacker.name}** attacks...`;
             }
        }

        if (attackRoll !== undefined) {
             content += ` (Roll: **${attackRoll}**)`;
        }

        let updatedTarget = target;
        const dmg = damage || 0;

        if (target && isHit && dmg > 0) {
            updatedTarget = await prisma.character.update({
                where: { id: target.id },
                data: { hp: { decrement: dmg } }
            });
            await syncToSource(updatedTarget);

            content += `, cutting deep for **${dmg}** damage`;
            if (updatedTarget.hp <= 0) {
                content += `, knocking them **UNCONSCIOUS**!`;
            } else {
                content += `.`;
            }
        } else if (target && isHit && damage !== undefined) {
            content += ` but deals no damage.`;
        }

        await logAction(attacker.campaignId, content, "Combat");

        revalidatePath('/dm');
        revalidatePath('/player');
        return updatedTarget || { success: true };
    });
}

export async function performSkillCheck(characterId: string, skillName: string, dc?: number, roll?: number, dieRoll?: number, modifier?: number): Promise<ActionResult> {
    return actionWrapper("performSkillCheck", async () => {
        // Quartermaster: Cleanse Inputs
        const validated = SkillCheckActionSchema.parse({ characterId, skillName, dc, roll, dieRoll, modifier });

        const character = await prisma.character.findUnique({ where: { id: validated.characterId } });
        if (!character) throw new Error("Character not found");

        let content = `**${character.name}** attempts to **${skillName}**`;

        if (roll !== undefined) {
            if (dieRoll === 20) {
                content += `: **CRITICAL SUCCESS**! **${character.name}** performs the feat with legendary skill!`;
            } else if (dieRoll === 1) {
                content += `: **CRITICAL FAILURE**! **${character.name}** attempts the impossible and fails spectacularly.`;
            } else if (dc) {
                if (roll >= dc) {
                    content += `: **SUCCESS**! They pull it off.`;
                } else {
                    content += `: **FAILURE**! It was not enough.`;
                }
            }

            if (dc) {
                if (dieRoll !== undefined && modifier !== undefined) {
                    const sign = modifier >= 0 ? '+' : '';
                    content += ` (Roll: **${dieRoll}**${sign}**${modifier}** = **${roll}** vs DC **${dc}**)`;
                } else {
                    content += ` (Roll: **${roll}** vs DC **${dc}**)`;
                }
            } else {
                if (dieRoll !== undefined && modifier !== undefined) {
                    const sign = modifier >= 0 ? '+' : '';
                    content += ` (Roll: **${dieRoll}**${sign}**${modifier}** = **${roll}**)`;
                } else {
                    content += ` (Roll: **${roll}**)`;
                }
            }
        } else {
            if (dc) content += ` (DC **${dc}**)`;
        }

        await logAction(character.campaignId, content + ".", "Roll");
        return { success: true };
    });
}

export async function castSpell(casterId: string, targetId: string | undefined, spellName: string, condition?: string): Promise<ActionResult> {
    return actionWrapper("castSpell", async () => {
        // Quartermaster: Cleanse Inputs
        const validated = SpellCastActionSchema.parse({ casterId, targetId, spellName, condition });

        const caster = await prisma.character.findUnique({ where: { id: validated.casterId } });
        if (!caster) throw new Error("Caster not found");

        let targetName = "";
        let target = null;

        if (validated.targetId) {
            target = await prisma.character.findUnique({ where: { id: validated.targetId } });
            if (target) targetName = target.name;
        }

        let content = `**${caster.name}** weaves the arcane, casting **${validated.spellName}**`;
        if (targetName) {
            content += `, targeting **${targetName}**`;
        }

        if (validated.condition && target) {
            content += `. The air shimmers as **${validated.condition}** is imposed upon them`;

            const currentConditions = parseConditions(target.conditions);
            if (!currentConditions.includes(validated.condition)) {
                currentConditions.push(validated.condition);
                const updatedTarget = await prisma.character.update({
                    where: { id: target.id },
                    data: { conditions: stringifyConditions(currentConditions) }
                });
                await syncToSource(updatedTarget);
            }
        }

        content += `.`;

        await logAction(caster.campaignId, content, "Combat");

        revalidatePath('/dm');
        revalidatePath('/player');
        return { success: true };
    });
}

export async function updateSettings(formData: FormData): Promise<ActionResult<Settings>> {
    return actionWrapper("updateSettings", async () => {
        const settingsData = parseSettingsForm(formData);

        // Since we only have one settings record, we find first and update it, or create if missing
        let settings = await prisma.settings.findFirst();

        if (settings) {
            settings = await prisma.settings.update({
                where: { id: settings.id },
                data: settingsData
            });
        } else {
            settings = await prisma.settings.create({
                data: settingsData
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
        return getEncounters(campaignId);
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

        // Update each character's initiative roll - Batched Transaction
        const updates = participants.map(p =>
            prisma.character.update({
                where: { id: p.characterId },
                data: { initiativeRoll: p.initiative }
            })
        );
        await prisma.$transaction(updates);

        await logAction(encounter.campaignId, `Tension fills the air. The encounter **${encounter.name}** has begun!`, "Combat");

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

        await logAction(campaignId, `Silence falls as combat ends. The dust settles on the battlefield.`, "Story");

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
                attributes: stringifyAttributes(parseAttributes(source.attributes)),
                inventory: stringifyInventory(parseInventory(source.inventory)),
                conditions: "[]",
                initiativeRoll: 0,
                sourceId: source.id // Link to source for future sync if needed
            }
        });

        await logAction(campaignId, `**${newChar.name}** is summoned from the archives to join the adventure.`, "Story");

        revalidatePath('/dm');
        revalidatePath('/player');
        return newChar;
    });
}
