/*
  Warnings:

  - You are about to alter the column `timestampMs` on the `MediaAsset` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `timestampMs` on the `ShotEvent` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "timestampMs" BIGINT NOT NULL,
    CONSTRAINT "MediaAsset_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MediaAsset" ("id", "kind", "sessionId", "timestampMs", "url") SELECT "id", "kind", "sessionId", "timestampMs", "url" FROM "MediaAsset";
DROP TABLE "MediaAsset";
ALTER TABLE "new_MediaAsset" RENAME TO "MediaAsset";
CREATE INDEX "MediaAsset_sessionId_idx" ON "MediaAsset"("sessionId");
CREATE TABLE "new_ShotEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "targetPlacementId" TEXT NOT NULL,
    "timestampMs" BIGINT NOT NULL,
    "hit" BOOLEAN NOT NULL,
    "hitZone" TEXT,
    "reactionTimeMs" INTEGER,
    "splitTimeMs" INTEGER,
    CONSTRAINT "ShotEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShotEvent_targetPlacementId_fkey" FOREIGN KEY ("targetPlacementId") REFERENCES "TargetPlacement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ShotEvent" ("hit", "hitZone", "id", "reactionTimeMs", "sessionId", "splitTimeMs", "targetPlacementId", "timestampMs") SELECT "hit", "hitZone", "id", "reactionTimeMs", "sessionId", "splitTimeMs", "targetPlacementId", "timestampMs" FROM "ShotEvent";
DROP TABLE "ShotEvent";
ALTER TABLE "new_ShotEvent" RENAME TO "ShotEvent";
CREATE INDEX "ShotEvent_sessionId_idx" ON "ShotEvent"("sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
