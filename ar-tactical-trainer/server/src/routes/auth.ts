import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signAccessToken } from "../auth/jwt.js";
import { authenticate } from "../auth/plugin.js";

const registerSchema = z.object({
  orgName: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicOperator(op: { id: string; orgId: string; name: string; email: string; role: string }) {
  return { id: op.id, orgId: op.orgId, name: op.name, email: op.email, role: op.role };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Creates a new org plus its first admin account. There's no invite flow
  // yet — every subsequent operator/trainer for that org is added via the
  // authenticated POST /operators (roster management), not another
  // /auth/register call.
  app.post("/auth/register", async (req, reply) => {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.operator.findUnique({ where: { email: body.email } });
    if (existing) {
      reply.code(409);
      return { error: "an account with that email already exists" };
    }

    const org = await prisma.org.create({ data: { name: body.orgName } });
    const operator = await prisma.operator.create({
      data: {
        orgId: org.id,
        name: body.name,
        email: body.email,
        role: "admin",
        passwordHash: hashPassword(body.password),
      },
    });

    const accessToken = signAccessToken({
      operatorId: operator.id,
      orgId: operator.orgId,
      role: operator.role as "admin",
    });
    reply.code(201);
    return { accessToken, operator: publicOperator(operator) };
  });

  app.post("/auth/login", async (req, reply) => {
    const body = loginSchema.parse(req.body);

    const operator = await prisma.operator.findUnique({ where: { email: body.email } });
    if (!operator || !operator.passwordHash || !verifyPassword(body.password, operator.passwordHash)) {
      reply.code(401);
      return { error: "invalid email or password" };
    }

    const accessToken = signAccessToken({
      operatorId: operator.id,
      orgId: operator.orgId,
      role: operator.role as "operator" | "trainer" | "admin",
    });
    return { accessToken, operator: publicOperator(operator) };
  });

  app.get("/auth/me", { preHandler: authenticate }, async (req, reply) => {
    const operator = await prisma.operator.findUnique({ where: { id: req.operator!.operatorId } });
    if (!operator) {
      reply.code(404);
      return { error: "operator not found" };
    }
    return publicOperator(operator);
  });
}
