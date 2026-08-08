-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('ACTIVE', 'PASSED', 'FAILED', 'FUNDED_ACTIVE', 'FUNDED_BREACHED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'DENIED');

-- CreateTable
CREATE TABLE "evaluation_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "pointValueUsd" DOUBLE PRECISION NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluationPassedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "paidProfitCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "evaluationAttemptId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evaluation_attempts_userId_idx" ON "evaluation_attempts"("userId");

-- CreateIndex
CREATE INDEX "payout_requests_userId_idx" ON "payout_requests"("userId");

-- CreateIndex
CREATE INDEX "payout_requests_evaluationAttemptId_idx" ON "payout_requests"("evaluationAttemptId");

-- AddForeignKey
ALTER TABLE "evaluation_attempts" ADD CONSTRAINT "evaluation_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_evaluationAttemptId_fkey" FOREIGN KEY ("evaluationAttemptId") REFERENCES "evaluation_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
