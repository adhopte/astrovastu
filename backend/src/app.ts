import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config.js";
import { errorHandler } from "./lib/http.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { kundaliRouter } from "./routes/kundali.js";
import { vastuRouter } from "./routes/vastu.js";
import { consultationRouter } from "./routes/consultations.js";
import { activityRouter } from "./routes/activity.js";
import { geoRouter } from "./routes/geo.js";
import { aiAvailable } from "./ai/claude.js";
import { getDb } from "./db/index.js";

export function createApp() {
  getDb(); // run migrations eagerly
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  // Native apps send no Origin header; CORS only matters for the web build.
  app.use(cors({ origin: config.corsOrigins.length ? config.corsOrigins : true }));
  app.use(express.json({ limit: "1mb" }));
  if (config.env !== "test") app.use(morgan(config.env === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => res.json({ ok: true, ai: aiAvailable(), time: new Date().toISOString() }));

  const api = express.Router();
  api.use("/auth", authRouter);
  api.use("/me", meRouter);
  api.use("/kundalis", kundaliRouter);
  api.use("/vastu", vastuRouter);
  api.use("/consultations", consultationRouter);
  api.use("/activity", activityRouter);
  api.use("/geo", geoRouter);
  app.use("/api/v1", api);

  app.use((_req, res) => res.status(404).json({ error: "not_found", message: "Route not found" }));
  app.use(errorHandler);
  return app;
}
