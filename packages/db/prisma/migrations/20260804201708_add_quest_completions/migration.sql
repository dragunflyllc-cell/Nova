-- CreateTable
CREATE TABLE "quest_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quest_completions_userId_idx" ON "quest_completions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "quest_completions_userId_questId_key" ON "quest_completions"("userId", "questId");

-- AddForeignKey
ALTER TABLE "quest_completions" ADD CONSTRAINT "quest_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
