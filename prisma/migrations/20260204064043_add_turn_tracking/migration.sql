-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "race" TEXT,
    "class" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
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
    CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("armorClass", "attributes", "campaignId", "class", "conditions", "hp", "id", "initiative", "level", "maxHp", "name", "race", "speed", "type") SELECT "armorClass", "attributes", "campaignId", "class", "conditions", "hp", "id", "initiative", "level", "maxHp", "name", "race", "speed", "type" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
