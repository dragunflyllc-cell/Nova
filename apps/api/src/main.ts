import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import { characterFamilies, characterStages } from "@nova/nova-dex";
import { env } from "./env.js";
import { authRoutes } from "./routes/auth.js";
import { brokerRoutes } from "./routes/brokers.js";
import { characterRoutes } from "./routes/characters.js";
import { fillRoutes } from "./routes/fills.js";
import { progressionRoutes } from "./routes/progression.js";
import { ruleRoutes } from "./routes/rules.js";
import { waitlistRoutes } from "./routes/waitlist.js";

const app = Fastify({ logger: true });

app.register(cors, { origin: env.CORS_ORIGIN });

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
app.register(brokerRoutes);
app.register(fillRoutes);
app.register(progressionRoutes);
app.register(ruleRoutes);
app.register(waitlistRoutes);

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
