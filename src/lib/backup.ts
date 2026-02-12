
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

const BACKUP_DIR = '/app/backups';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export interface BackupData {
    timestamp: string;
    campaigns: any[];
    characters: any[];
    logs: any[];
    encounters: any[];
}

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

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    return filename;
}

export function listBackups(): string[] {
    try {
        if (!fs.existsSync(BACKUP_DIR)) return [];
        return fs.readdirSync(BACKUP_DIR)
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

    if (!fs.existsSync(filepath)) {
        throw new Error(`Backup file ${filename} not found`);
    }

    try {
        fs.unlinkSync(filepath);
        return true;
    } catch (e) {
        console.error(`Failed to delete backup ${filename}:`, e);
        throw e;
    }
}

export async function restoreBackup(filename: string): Promise<boolean> {
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
        throw new Error(`Backup file ${filename} not found`);
    }

    // Use reviveDates to restore Date objects
    const data: BackupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'), reviveDates);

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

        const backups = listBackups();
        const today = new Date().toISOString().split('T')[0];
        // Filename format: backup-YYYY-MM-DDTHH-mm-ss-sssZ.json
        // Check if any backup contains today's date
        const hasBackupToday = backups.some(b => b.includes(today));

        if (!hasBackupToday) {
            console.log("Auto-backup triggered...");
            await createBackup();

            // Rotate backups if needed
            const updatedBackups = listBackups();
            if (updatedBackups.length > settings.backupCount) {
                const toDelete = updatedBackups.slice(settings.backupCount);
                for (const file of toDelete) {
                    try {
                        const filepath = path.join(BACKUP_DIR, file);
                        if (fs.existsSync(filepath)) {
                            fs.unlinkSync(filepath);
                            console.log(`Rotated old backup: ${file}`);
                        }
                    } catch (e) {
                        console.error(`Failed to delete old backup ${file}:`, e);
                    }
                }
            }
        }
    } catch (e) {
        console.error("Auto-backup check failed:", e);
    }
}
