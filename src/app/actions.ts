'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCampaign(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name) return;

    await prisma.campaign.create({
        data: {
            name,
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
}

export async function logAction(campaignId: string, content: string, type: string = "Story") {
    await prisma.logEntry.create({ data: { campaignId, content, type } });
    revalidatePath('/dm');
    revalidatePath('/public');
}

export async function updateHP(characterId: string, delta: number) {
    await prisma.character.update({
        where: { id: characterId },
        data: { hp: { increment: delta } }
    });
    revalidatePath('/dm');
    revalidatePath('/public');
}

export async function updateInitiative(characterId: string, roll: number) {
    await prisma.character.update({
        where: { id: characterId },
        data: { initiativeRoll: roll }
    });
    revalidatePath('/dm');
}

export async function setNextTurn(campaignId: string, currentCharacterId: string) {
    // 1. Unset current turn
    await prisma.character.updateMany({
        where: { campaignId, activeTurn: true },
        data: { activeTurn: false }
    });

    // 2. Set new turn
    await prisma.character.update({
        where: { id: currentCharacterId },
        data: { activeTurn: true }
    });

    revalidatePath('/dm');
    revalidatePath('/public');
}

export async function activateCampaign(campaignId: string) {
    // Deactivate all
    await prisma.campaign.updateMany({
        data: { active: false }
    });

    // Activate target
    await prisma.campaign.update({
        where: { id: campaignId },
        data: { active: true }
    });

    revalidatePath('/dm');
    revalidatePath('/public');
}

export async function updateCharacterImage(characterId: string, imageUrl: string) {
    await prisma.character.update({
        where: { id: characterId },
        data: { imageUrl }
    });
    revalidatePath('/public');
    revalidatePath('/dm');
}

// Very basic file upload handler (Local FS only)
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function uploadAvatar(formData: FormData) {
    const file = formData.get('file') as File;
    const characterId = formData.get('characterId') as string;

    if (!file || !characterId) return;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Safe filename
    const filename = `${characterId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const path = join(process.cwd(), 'public/avatars', filename);

    await writeFile(path, buffer);

    const imageUrl = `/avatars/${filename}`;
    await updateCharacterImage(characterId, imageUrl);
}
