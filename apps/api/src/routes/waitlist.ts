import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";

const joinSchema = z.object({
  email: z.string().email(),
  propFirmCode: z.string().trim().min(1).max(64).optional(),
});

export async function waitlistRoutes(app: FastifyInstance): Promise<void> {
  // Idempotent on purpose: joining twice with the same email should feel
  // like success both times, not leak whether an email already signed up.
  // If a code is supplied on a repeat signup, it's recorded (so someone who
  // joined without one and comes back with one still gets attributed) — but
  // a supplied code never gets cleared by a later signup without one.
  app.post("/waitlist", async (request, reply) => {
    const { email, propFirmCode } = joinSchema.parse(request.body);
    await prisma.waitlistSignup.upsert({
      where: { email },
      create: { email, propFirmCode: propFirmCode ?? null },
      update: propFirmCode ? { propFirmCode } : {},
    });
    return reply.code(201).send({ status: "joined" });
  });

  app.get("/waitlist/count", async (_request, reply) => {
    const count = await prisma.waitlistSignup.count();
    return reply.send({ count });
  });
}
