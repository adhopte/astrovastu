import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { IANAZone } from "luxon";
import { requireAuth, userIdOf } from "../auth/jwt.js";
import { getDb } from "../db/index.js";
import { buildKundali, Kundali } from "../astro/kundali.js";
import { buildReport } from "../astro/predictions.js";
import { HttpError } from "../lib/http.js";
import { logActivity } from "../lib/activity.js";
import { langOf } from "../lib/lang.js";
import { aiKundaliReading, aiAvailable } from "../ai/claude.js";

export const kundaliRouter = Router();
kundaliRouter.use(requireAuth);

export const birthSchema = z.object({
  name: z.string().trim().min(1).max(120),
  gender: z.enum(["male", "female", "other"]).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  placeName: z.string().trim().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().refine((tz) => IANAZone.isValidZone(tz), "Unknown timezone"),
});

interface KundaliRow {
  id: string;
  user_id: string;
  name: string;
  gender: string | null;
  birth_date: string;
  birth_time: string;
  place_name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  chart_json: string;
  ai_reading_json: string | null;
  created_at: string;
}

export function loadKundali(userId: string, id: string): { row: KundaliRow; chart: Kundali } {
  const row = getDb().prepare("SELECT * FROM kundalis WHERE id = ? AND user_id = ?").get(id, userId) as KundaliRow | undefined;
  if (!row) throw new HttpError(404, "Kundali not found", "not_found");
  const stored = JSON.parse(row.chart_json) as Kundali;
  // Recompute so dasha "current" markers and transit-based doshas (Sade Sati) stay up to date.
  return { row, chart: buildKundali(stored.input) };
}

export function createKundaliRecord(userId: string, input: z.infer<typeof birthSchema>) {
  let chart: Kundali;
  try {
    chart = buildKundali(input);
  } catch (e) {
    throw new HttpError(400, (e as Error).message, "invalid_birth_data");
  }
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO kundalis (id, user_id, name, gender, birth_date, birth_time, place_name, latitude, longitude, timezone, chart_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, userId, input.name, input.gender ?? null, input.birthDate, input.birthTime, input.placeName, input.latitude, input.longitude, input.timezone, JSON.stringify(chart), new Date().toISOString());
  return { id, chart };
}

const summary = (r: KundaliRow) => {
  const c = JSON.parse(r.chart_json) as Kundali;
  return {
    id: r.id, name: r.name, gender: r.gender, birthDate: r.birth_date, birthTime: r.birth_time, placeName: r.place_name,
    lagnaSign: c.ascendant.sign, moonSign: c.moonSign, nakshatra: c.planets.find((p) => p.id === "moon")!.nakshatra, createdAt: r.created_at,
  };
};

kundaliRouter.post("/", (req, res) => {
  const input = birthSchema.parse(req.body);
  const userId = userIdOf(req);
  const { id, chart } = createKundaliRecord(userId, input);
  getDb().prepare("INSERT INTO consultations (id, user_id, kind, kundali_id, created_at) VALUES (?, ?, 'astro', ?, ?)").run(randomUUID(), userId, id, new Date().toISOString());
  logActivity(req, userId, "kundali.create", { type: "kundali", id }, { name: input.name, place: input.placeName });
  res.status(201).json({ id, chart, report: buildReport(chart, langOf(req)) });
});

kundaliRouter.get("/", (req, res) => {
  const rows = getDb().prepare("SELECT * FROM kundalis WHERE user_id = ? ORDER BY created_at DESC LIMIT 200").all(userIdOf(req)) as unknown as KundaliRow[];
  res.json({ items: rows.map(summary) });
});

kundaliRouter.get("/:id", (req, res) => {
  const userId = userIdOf(req);
  const { row, chart } = loadKundali(userId, req.params.id);
  const lang = langOf(req);
  const ai = row.ai_reading_json ? (JSON.parse(row.ai_reading_json) as Record<string, unknown>) : {};
  logActivity(req, userId, "kundali.view", { type: "kundali", id: row.id });
  res.json({ id: row.id, record: summary(row), chart, report: buildReport(chart, lang), aiReading: ai[lang] ?? null, aiAvailable: aiAvailable() });
});

kundaliRouter.delete("/:id", (req, res) => {
  const userId = userIdOf(req);
  const r = getDb().prepare("DELETE FROM kundalis WHERE id = ? AND user_id = ?").run(req.params.id, userId);
  if (r.changes === 0) throw new HttpError(404, "Kundali not found", "not_found");
  logActivity(req, userId, "kundali.delete", { type: "kundali", id: req.params.id });
  res.status(204).end();
});

/** Optional narrative reading from Claude, grounded in the computed chart. Cached per language. */
kundaliRouter.post("/:id/ai-reading", async (req, res) => {
  const userId = userIdOf(req);
  const { row, chart } = loadKundali(userId, req.params.id);
  const lang = langOf(req);
  const cached = row.ai_reading_json ? (JSON.parse(row.ai_reading_json) as Record<string, unknown>) : {};
  if (cached[lang] && !req.body?.refresh) return res.json({ aiReading: cached[lang] });
  const reading = await aiKundaliReading(chart, buildReport(chart, lang), lang);
  cached[lang] = reading;
  getDb().prepare("UPDATE kundalis SET ai_reading_json = ? WHERE id = ?").run(JSON.stringify(cached), row.id);
  logActivity(req, userId, "kundali.ai_reading", { type: "kundali", id: row.id }, { lang });
  res.json({ aiReading: reading });
});
