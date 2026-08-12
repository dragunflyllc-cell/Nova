import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import { ZodError } from "zod";
import { env } from "./env.js";
import { authRoutes } from "./routes/auth.js";
import { operatorRoutes } from "./routes/operators.js";
import { facilityRoutes } from "./routes/facilities.js";
import { scenarioRoutes } from "./routes/scenarios.js";
import { sessionRoutes } from "./routes/sessions.js";
import { shotRoutes } from "./routes/shots.js";
import { mediaRoutes } from "./routes/media.js";
import { statsRoutes } from "./routes/stats.js";
import { registerWsRelay } from "./ws/relay.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  // The console (its own origin, :3100 in dev) calls this API directly from
  // the browser for client components; it forwards the access token as an
  // Authorization header rather than relying on cookies, so no credentials
  // mode is needed here — just an allowed origin for the preflight.
  app.register(fastifyCors, { origin: env.consoleOrigin });
  app.register(fastifyWebsocket);
  app.register(fastifyMultipart);
  app.register(fastifyStatic, { root: env.mediaStorageDir, prefix: "/media/" });

  app.get("/health", async () => ({ ok: true }));

  // Every route validates its body with `schema.parse(req.body)`
  // (zod throws on bad input); without this, that throw fell through to
  // Fastify's default handler as a 500 instead of the 400 it actually is.
  // A preHandler like `authenticate` that already called `reply.code(401)`
  // before throwing keeps that status — only a truly unset (still-200)
  // status falls back to 500 here.
  app.setErrorHandler((error: Error, _request, reply) => {
    if (error instanceof ZodError) {
      reply.code(400);
      return reply.send({ error: "validation failed", issues: error.issues });
    }
    const statusCode = reply.statusCode >= 400 ? reply.statusCode : 500;
    reply.code(statusCode);
    return reply.send({ error: error.message });
  });

  app.register(authRoutes);
  app.register(operatorRoutes);
  app.register(facilityRoutes);
  app.register(scenarioRoutes);
  app.register(sessionRoutes);
  app.register(shotRoutes);
  app.register(mediaRoutes);
  app.register(statsRoutes);
  app.register((instance) => {
    registerWsRelay(instance);
    return Promise.resolve();
  });

  return app;
}

async function main() {
  const app = buildApp();
  await app.listen({ port: env.port, host: "0.0.0.0" });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
