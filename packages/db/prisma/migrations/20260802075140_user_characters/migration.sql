-- CreateTable
CREATE TABLE "user_characters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_characters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_characters_userId_idx" ON "user_characters"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_characters_userId_familyId_key" ON "user_characters"("userId", "familyId");

-- AddForeignKey
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
