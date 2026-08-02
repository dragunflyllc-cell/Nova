import Fastify from "fastify";
import { characterFamilies, characterStages } from "@nova/nova-dex";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok" }));

app.get("/novadex/families", async () => characterFamilies);

app.get("/novadex/characters", async () => characterStages);

const port = Number(process.env.PORT ?? 4000);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
