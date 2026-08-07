import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ACCESS_TOKEN_SECRET: z.string().min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters"),
  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be 64 hex characters (32 bytes) — generate with `openssl rand -hex 32`"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Tradovate — see docs/ARCHITECTURE.md#broker-integrations for what's verified vs. assumed.
  TRADOVATE_CLIENT_ID: z.string().min(1),
  TRADOVATE_CLIENT_SECRET: z.string().min(1),
  TRADOVATE_REDIRECT_URI: z.string().url(),
  TRADOVATE_ENV: z.enum(["demo", "live"]).default("demo"),

  // Rithmic — Nova-wide deployment constants (which system/gateway Nova
  // connects through); each end user still brings their own username/
  // password. See services/rithmic-sidecar/README.md.
  RITHMIC_SIDECAR_URL: z.string().url().default("http://localhost:8100"),
  RITHMIC_SYSTEM_NAME: z.string().min(1),
  RITHMIC_GATEWAY_URL: z.string().min(1),
});

export const env = envSchema.parse(process.env);
