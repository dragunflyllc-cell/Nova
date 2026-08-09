import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { env } from "./env.js";
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

  app.register(fastifyWebsocket);
  app.register(fastifyMultipart);
  app.register(fastifyStatic, { root: env.mediaStorageDir, prefix: "/media/" });

  app.get("/health", async () => ({ ok: true }));

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
