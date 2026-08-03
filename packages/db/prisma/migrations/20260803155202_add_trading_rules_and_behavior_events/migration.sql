-- CreateEnum
CREATE TYPE "TradingRuleType" AS ENUM ('MAX_TRADES_PER_DAY', 'MIN_COOLDOWN_AFTER_LOSS_MINUTES', 'MAX_POSITION_SIZE', 'MAX_DAILY_LOSS_POINTS', 'TRADING_HOURS_WINDOW_UTC');

-- CreateEnum
CREATE TYPE "BehaviorSignalType" AS ENUM ('REVENGE_TRADE', 'COOLDOWN_AFTER_LOSS', 'RULE_VIOLATION', 'RULE_ADHERENCE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dataSharingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dataSharingConsentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "trading_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TradingRuleType" NOT NULL,
    "params" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trading_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signal" "BehaviorSignalType" NOT NULL,
    "tradeRef" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL DEFAULT '',
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavior_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trading_rules_userId_idx" ON "trading_rules"("userId");

-- CreateIndex
CREATE INDEX "behavior_events_userId_idx" ON "behavior_events"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "behavior_events_userId_signal_tradeRef_ruleId_key" ON "behavior_events"("userId", "signal", "tradeRef", "ruleId");

-- AddForeignKey
ALTER TABLE "trading_rules" ADD CONSTRAINT "trading_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_events" ADD CONSTRAINT "behavior_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
