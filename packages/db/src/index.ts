import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __novaPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__novaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__novaPrisma = prisma;
}

export * from "@prisma/client";
