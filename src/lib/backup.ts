
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { z } from 'zod';
import { Campaign, Character, LogEntry, Encounter } from '@prisma/client';
import { AttributesSchema, InventorySchema, ConditionsSchema, ParticipantsSchema, jsonStringSchema } from './schemas';

const BACKUP_DIR = '/app/backups';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export interface BackupData {
    timestamp: string;
    campaigns: Campaign[];
    characters: Character[];
    logs: LogEntry[];
    encounters: Encounter[];
}

const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CharacterBackupSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  race: z.string().nullable(),
  class: z.string().nullable(),
  level: z.number(),
  imageUrl: z.string().nullable(),
  hp: z.number(),
  maxHp: z.number(),
  armorClass: z.number(),
  speed: z.number(),
  initiative: z.number(),
  attributes: jsonStringSchema(AttributesSchema, "Invalid attributes JSON"),
  inventory: jsonStringSchema(InventorySchema, "Invalid inventory JSON"),
  conditions: jsonStringSchema(ConditionsSchema, "Invalid conditions JSON"),
  campaignId: z.string(),
  activeTurn: z.boolean(),
  initiativeRoll: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  sourceId: z.string().nullable(),
});

const LogEntrySchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.string(),
  timestamp: z.date(),
  campaignId: z.string(),
});

const EncounterBackupSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  participants: jsonStringSchema(ParticipantsSchema, "Invalid participants JSON"),
  campaignId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const BackupDataSchema = z.object({
    timestamp: z.string(),
    campaigns: z.array(CampaignSchema),
    characters: z.array(CharacterBackupSchema),
    logs: z.array(LogEntrySchema),
    encounters: z.array(EncounterBackupSchema),
});

// Reviver for JSON.parse to convert ISO date strings back to Date objects
function reviveDates(key: string, value: any) {
    // Regex for ISO 8601 date format (e.g., 2023-10-27T10:00:00.000Z)
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
    if (typeof value === 'string' && isoDateRegex.test(value)) {
        return new Date(value);
    }
    return value;
}

export async function createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    const campaigns = await prisma.campaign.findMany();
    const characters = await prisma.character.findMany(); // Includes duplicates from library
    const logs = await prisma.logEntry.findMany();
    const encounters = await prisma.encounter.findMany();

    const data: BackupData = {
        timestamp,
        campaigns,
        characters,
        logs,
        encounters
    };

    await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2));
    return filename;
}

export async function listBackups(): Promise<string[]> {
    try {
        try {
            await fs.promises.access(BACKUP_DIR);
        } catch {
            return [];
        }
        const files = await fs.promises.readdir(BACKUP_DIR);
        return files
            .filter(file => file.endsWith('.json'))
            .sort()
            .reverse();
    } catch (e) {
        console.error("Failed to list backups:", e);
        return [];
    }
}

export async function deleteBackup(filename: string): Promise<boolean> {
    // Sanitize filename to prevent path traversal
    const safeFilename = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeFilename);

    try {
        await fs.promises.access(filepath);
    } catch {
        throw new Error(`Backup file ${filename} not found`);
    }

    try {
        await fs.promises.unlink(filepath);
        return true;
    } catch (e) {
        console.error(`Failed to delete backup ${filename}:`, e);
        throw e;
    }
}

export async function restoreBackup(filename: string): Promise<boolean> {
    const filepath = path.join(BACKUP_DIR, filename);
    try {
        await fs.promises.access(filepath);
    } catch {
        throw new Error(`Backup file ${filename} not found`);
    }

    // Use reviveDates to restore Date objects
    let rawData;
    try {
        rawData = JSON.parse(await fs.promises.readFile(filepath, 'utf-8'), reviveDates);
    } catch (e) {
        console.error(`Failed to parse backup file ${filename}:`, e);
        throw new Error(`Failed to parse backup file ${filename}: Invalid JSON format.`);
    }

    // Validate structure
    const data = BackupDataSchema.parse(rawData) as BackupData;

    // Transactional Restore
    // We must handle foreign key constraints carefully.
    // Order: Delete Leaves -> Delete Roots -> Create Roots -> Create Leaves

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Clean Slate
            console.log("Cleaning Database...");
            await tx.logEntry.deleteMany();
            await tx.encounter.deleteMany();
            // Updat sourceId to null to avoid self-referential delete issues if any custom constraints exist
            // simpler: just deleteMany. Postgres handles SetNull.
            await tx.character.deleteMany();
            await tx.campaign.deleteMany();

            // 2. Restore Campaigns
            console.log(`Restoring ${data.campaigns.length} campaigns...`);
            if (data.campaigns.length > 0) {
                await tx.campaign.createMany({ data: data.campaigns });
            }

            // 3. Restore Characters (First Pass - No SourceId)
            // We strip sourceId to avoid FK errors if the source hasn't been created yet.
            console.log(`Restoring ${data.characters.length} characters (Pass 1)...`);
            if (data.characters.length > 0) {
                const charsNoSource = data.characters.map(c => {
                    const { sourceId, ...rest } = c;
                    return { ...rest, sourceId: null };
                });
                await tx.character.createMany({ data: charsNoSource });
            }

            // 4. Restore Logs & Encounters
            console.log(`Restoring logs and encounters...`);
            if (data.logs.length > 0) await tx.logEntry.createMany({ data: data.logs });
            if (data.encounters.length > 0) await tx.encounter.createMany({ data: data.encounters });

            // 5. Restore Character Links (Pass 2 - SourceId)
            // We now update characters to restore their sourceId links.
            console.log("Linking characters (Pass 2)...");
            const charsWithSource = data.characters.filter(c => c.sourceId);
            for (const char of charsWithSource) {
                await tx.character.update({
                    where: { id: char.id },
                    data: { sourceId: char.sourceId }
                });
            }
        });

        return true;
    } catch (e) {
        console.error("Restore failed:", e);
        throw e;
    }
}

export async function checkAutoBackup() {
    try {
        const settings = await prisma.settings.findFirst();
        if (!settings || !settings.autoBackup) return;

        const backups = await listBackups();
        const today = new Date().toISOString().split('T')[0];
        // Filename format: backup-YYYY-MM-DDTHH-mm-ss-sssZ.json
        // Check if any backup contains today's date
        const hasBackupToday = backups.some(b => b.includes(today));

        if (!hasBackupToday) {
            console.log("Auto-backup triggered...");
            await createBackup();

            // Rotate backups if needed
            const updatedBackups = await listBackups();
            if (updatedBackups.length > settings.backupCount) {
                const toDelete = updatedBackups.slice(settings.backupCount);
                const deletePromises = toDelete.map(async (file) => {
                    try {
                        const filepath = path.join(BACKUP_DIR, file);
                        await fs.promises.unlink(filepath);
                        console.log(`Rotated old backup: ${file}`);
                    } catch (e) {
                        console.error(`Failed to delete old backup ${file}:`, e);
                    }
                });
                await Promise.all(deletePromises);
            }
        }
    } catch (e) {
        console.error("Auto-backup check failed:", e);
    }
}
