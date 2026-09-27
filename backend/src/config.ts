import "dotenv/config";

const bool = (v: string | undefined, d = false) => (v === undefined ? d : ["1", "true", "yes"].includes(v.toLowerCase()));
const list = (v: string | undefined) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

const nodeEnv = process.env.NODE_ENV ?? "development";

export const config = {
  env: nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? (nodeEnv === "production" ? "" : "dev-only-insecure-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
  databasePath: process.env.DATABASE_PATH ?? "data/astrovastu.db",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  publicUrl: process.env.PUBLIC_URL ?? "",
  corsOrigins: list(process.env.CORS_ORIGINS),
  google: { clientIds: list(process.env.GOOGLE_CLIENT_IDS) },
  facebook: { appId: process.env.FACEBOOK_APP_ID ?? "", appSecret: process.env.FACEBOOK_APP_SECRET ?? "" },
  apple: { audiences: list(process.env.APPLE_AUDIENCES) },
  /** Enables POST /auth/demo for local testing without OAuth credentials. Never enable in production. */
  devLogin: bool(process.env.AUTH_DEV_LOGIN, nodeEnv !== "production"),
  ai: { enabled: bool(process.env.AI_ENABLED, Boolean(process.env.ANTHROPIC_API_KEY)), model: process.env.AI_MODEL ?? "claude-opus-5" },
  geocodeUrl: process.env.GEOCODE_URL ?? "https://geocoding-api.open-meteo.com/v1/search",
};

if (!config.jwtSecret) throw new Error("JWT_SECRET must be set in production");
