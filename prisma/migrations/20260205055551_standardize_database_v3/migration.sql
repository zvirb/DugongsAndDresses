-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Encounter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planned',
    "participants" TEXT NOT NULL DEFAULT '[]',
    "campaignId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Encounter_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Encounter" ("campaignId", "id", "name", "participants", "status") SELECT "campaignId", "id", "name", "participants", "status" FROM "Encounter";
DROP TABLE "Encounter";
ALTER TABLE "new_Encounter" RENAME TO "Encounter";
CREATE INDEX "Encounter_campaignId_idx" ON "Encounter"("campaignId");
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Campaign" ("active", "createdAt", "id", "name", "updatedAt") SELECT "active", "createdAt", "id", "name", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE TABLE "new_LogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Story',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    CONSTRAINT "LogEntry_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LogEntry" ("campaignId", "content", "id", "timestamp", "type") SELECT "campaignId", "content", "id", "timestamp", "type" FROM "LogEntry";
DROP TABLE "LogEntry";
ALTER TABLE "new_LogEntry" RENAME TO "LogEntry";
CREATE INDEX "LogEntry_campaignId_idx" ON "LogEntry"("campaignId");
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PLAYER',
    "race" TEXT,
    "class" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "imageUrl" TEXT,
    "hp" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "armorClass" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL DEFAULT 30,
    "initiative" INTEGER NOT NULL DEFAULT 0,
    "attributes" TEXT NOT NULL DEFAULT '{}',
    "conditions" TEXT NOT NULL DEFAULT '[]',
    "campaignId" TEXT NOT NULL,
    "activeTurn" BOOLEAN NOT NULL DEFAULT false,
    "initiativeRoll" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("activeTurn", "armorClass", "attributes", "campaignId", "class", "conditions", "hp", "id", "imageUrl", "initiative", "initiativeRoll", "level", "maxHp", "name", "race", "speed", "type") SELECT "activeTurn", "armorClass", "attributes", "campaignId", "class", "conditions", "hp", "id", "imageUrl", "initiative", "initiativeRoll", "level", "maxHp", "name", "race", "speed", "type" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE INDEX "Character_campaignId_idx" ON "Character"("campaignId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
