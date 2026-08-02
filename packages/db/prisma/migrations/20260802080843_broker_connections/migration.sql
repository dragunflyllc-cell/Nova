-- CreateEnum
CREATE TYPE "BrokerProvider" AS ENUM ('TRADOVATE');

-- CreateTable
CREATE TABLE "broker_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "BrokerProvider" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_fills" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalFillId" TEXT NOT NULL,
    "contractSymbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "filledAt" TIMESTAMP(3) NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_fills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "broker_connections_userId_provider_key" ON "broker_connections"("userId", "provider");

-- CreateIndex
CREATE INDEX "broker_fills_connectionId_idx" ON "broker_fills"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "broker_fills_connectionId_externalFillId_key" ON "broker_fills"("connectionId", "externalFillId");

-- AddForeignKey
ALTER TABLE "broker_connections" ADD CONSTRAINT "broker_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_fills" ADD CONSTRAINT "broker_fills_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "broker_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
