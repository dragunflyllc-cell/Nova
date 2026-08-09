-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScanLayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityId" TEXT NOT NULL,
    "meshAssetUrl" TEXT NOT NULL,
    "anchorsJson" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedByOperatorId" TEXT NOT NULL,
    CONSTRAINT "ScanLayout_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScanLayout_capturedByOperatorId_fkey" FOREIGN KEY ("capturedByOperatorId") REFERENCES "Operator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TargetDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "modelRef" TEXT NOT NULL,
    "defaultAppearanceJson" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facilityId" TEXT,
    "passFailRulesJson" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Scenario_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TargetPlacement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "targetDefinitionId" TEXT NOT NULL,
    "anchorJson" TEXT NOT NULL,
    "appearanceOverrideJson" TEXT,
    "behaviorScriptJson" TEXT NOT NULL,
    CONSTRAINT "TargetPlacement_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TargetPlacement_targetDefinitionId_fkey" FOREIGN KEY ("targetDefinitionId") REFERENCES "TargetDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "outcome" TEXT NOT NULL DEFAULT 'inProgress',
    CONSTRAINT "Session_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Operator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShotEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "targetPlacementId" TEXT NOT NULL,
    "timestampMs" INTEGER NOT NULL,
    "hit" BOOLEAN NOT NULL,
    "hitZone" TEXT,
    "reactionTimeMs" INTEGER,
    "splitTimeMs" INTEGER,
    CONSTRAINT "ShotEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShotEvent_targetPlacementId_fkey" FOREIGN KEY ("targetPlacementId") REFERENCES "TargetPlacement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "timestampMs" INTEGER NOT NULL,
    CONSTRAINT "MediaAsset_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_email_key" ON "Operator"("email");

-- CreateIndex
CREATE INDEX "Operator_orgId_idx" ON "Operator"("orgId");

-- CreateIndex
CREATE INDEX "Facility_orgId_idx" ON "Facility"("orgId");

-- CreateIndex
CREATE INDEX "ScanLayout_facilityId_idx" ON "ScanLayout"("facilityId");

-- CreateIndex
CREATE INDEX "Scenario_orgId_idx" ON "Scenario"("orgId");

-- CreateIndex
CREATE INDEX "TargetPlacement_scenarioId_idx" ON "TargetPlacement"("scenarioId");

-- CreateIndex
CREATE INDEX "Session_operatorId_idx" ON "Session"("operatorId");

-- CreateIndex
CREATE INDEX "Session_scenarioId_idx" ON "Session"("scenarioId");

-- CreateIndex
CREATE INDEX "ShotEvent_sessionId_idx" ON "ShotEvent"("sessionId");

-- CreateIndex
CREATE INDEX "MediaAsset_sessionId_idx" ON "MediaAsset"("sessionId");
