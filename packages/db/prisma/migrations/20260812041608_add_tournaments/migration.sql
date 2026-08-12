-- CreateEnum
CREATE TYPE "TournamentMetric" AS ENUM ('ACCOUNT_XP_GAINED', 'CHARACTER_XP_GAINED', 'BEHAVIOR_NET_ADHERENCE');

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metric" "TournamentMetric" NOT NULL,
    "familyId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "prizePoolCents" INTEGER NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_entries" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startXp" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalScore" INTEGER,
    "rank" INTEGER,
    "prizeCents" INTEGER,

    CONSTRAINT "tournament_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournament_entries_tournamentId_idx" ON "tournament_entries"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_entries_userId_idx" ON "tournament_entries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_entries_tournamentId_userId_key" ON "tournament_entries"("tournamentId", "userId");

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
