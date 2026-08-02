import "dotenv/config";
import Fastify from "fastify";
import { ZodError } from "zod";
import { characterFamilies, characterStages } from "@nova/nova-dex";
import { env } from "./env.js";
import { authRoutes } from "./routes/auth.js";
import { characterRoutes } from "./routes/characters.js";

const app = Fastify({ logger: true });

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({ error: "Validation failed", issues: error.issues });
  }
  app.log.error(error);
  return reply.code(500).send({ error: "Internal server error" });
});

app.get("/health", async () => ({ status: "ok" }));

app.get("/novadex/families", async () => characterFamilies);

app.get("/novadex/characters", async () => characterStages);

app.register(authRoutes);
app.register(characterRoutes);

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
