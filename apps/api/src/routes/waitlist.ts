import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nova/db";

const joinSchema = z.object({
  email: z.string().email(),
});

export async function waitlistRoutes(app: FastifyInstance): Promise<void> {
  // Idempotent on purpose: joining twice with the same email should feel
  // like success both times, not leak whether an email already signed up.
  app.post("/waitlist", async (request, reply) => {
    const { email } = joinSchema.parse(request.body);
    await prisma.waitlistSignup.upsert({
      where: { email },
      create: { email },
      update: {},
    });
    return reply.code(201).send({ status: "joined" });
  });

  app.get("/waitlist/count", async (_request, reply) => {
    const count = await prisma.waitlistSignup.count();
    return reply.send({ count });
  });
}
