-- AlterEnum
ALTER TYPE "BrokerProvider" ADD VALUE 'PROJECTX';

-- AlterTable
ALTER TABLE "broker_connections" ADD COLUMN     "externalAccountId" TEXT,
ADD COLUMN     "externalUsername" TEXT;
