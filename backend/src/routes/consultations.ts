import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAuth, userIdOf } from "../auth/jwt.js";
import { getDb } from "../db/index.js";
import { buildReport } from "../astro/predictions.js";
import { buildVastuReport } from "../vastu/analysis.js";
import { buildCombinedReport } from "../vastu/combined.js";
import { HttpError } from "../lib/http.js";
import { logActivity } from "../lib/activity.js";
import { langOf } from "../lib/lang.js";
import { planUpload } from "../lib/upload.js";
import { birthSchema, createKundaliRecord, loadKundali } from "./kundali.js";
import { createVastuRecord, loadVastu, toInput, vastuSchema } from "./vastu.js";

export const consultationRouter = Router();
consultationRouter.use(requireAuth);

const bothSchema = z
  .object({
    kundaliId: z.string().optional(),
    birth: birthSchema.optional(),
    vastuId: z.string().optional(),
    vastu: vastuSchema.optional(),
  })
  .refine((b) => Boolean(b.kundaliId) !== Boolean(b.birth), "Provide exactly one of kundaliId or birth")
  .refine((b) => Boolean(b.vastuId) !== Boolean(b.vastu), "Provide exactly one of vastuId or vastu");

interface ConsultationRow {
  id: string;
  kind: "astro" | "vastu" | "both";
  kundali_id: string | null;
  vastu_id: string | null;
  created_at: string;
}

/** "Consult both": a kundali and a floor plan analysed together, with kundali-personalised vastu advice. */
consultationRouter.post("/both", planUpload.single("plan"), (req, res) => {
  const userId = userIdOf(req);
  const raw = typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
  const body = bothSchema.parse(raw);
  const kundaliId = body.kundaliId ? loadKundali(userId, body.kundaliId).row.id : createKundaliRecord(userId, body.birth!).id;
  const vastuId = body.vastuId ? loadVastu(userId, body.vastuId).id : createVastuRecord(userId, body.vastu!, req.file).id;
  const id = randomUUID();
  getDb().prepare("INSERT INTO consultations (id, user_id, kind, kundali_id, vastu_id, created_at) VALUES (?, ?, 'both', ?, ?, ?)").run(id, userId, kundaliId, vastuId, new Date().toISOString());
  logActivity(req, userId, "consultation.create", { type: "consultation", id }, { kind: "both", kundaliId, vastuId });
  res.status(201).json({ id, kundaliId, vastuId });
});

consultationRouter.get("/", (req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT c.id, c.kind, c.kundali_id, c.vastu_id, c.created_at, k.name AS kundali_name, v.title AS vastu_title, v.score AS vastu_score
       FROM consultations c LEFT JOIN kundalis k ON k.id = c.kundali_id LEFT JOIN vastu_records v ON v.id = c.vastu_id
       WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT 200`,
    )
    .all(userIdOf(req)) as Record<string, unknown>[];
  res.json({
    items: rows.map((r) => ({
      id: r.id, kind: r.kind, kundaliId: r.kundali_id, vastuId: r.vastu_id, kundaliName: r.kundali_name, vastuTitle: r.vastu_title, vastuScore: r.vastu_score, createdAt: r.created_at,
    })),
  });
});

consultationRouter.get("/:id", (req, res) => {
  const userId = userIdOf(req);
  const row = getDb().prepare("SELECT * FROM consultations WHERE id = ? AND user_id = ?").get(req.params.id, userId) as ConsultationRow | undefined;
  if (!row) throw new HttpError(404, "Consultation not found", "not_found");
  const lang = langOf(req);
  const k = row.kundali_id ? loadKundali(userId, row.kundali_id) : null;
  const v = row.vastu_id ? loadVastu(userId, row.vastu_id) : null;
  const vInput = v ? toInput(v) : null;
  logActivity(req, userId, "consultation.view", { type: "consultation", id: row.id });
  res.json({
    id: row.id,
    kind: row.kind,
    createdAt: row.created_at,
    kundali: k ? { id: k.row.id, name: k.row.name, chart: k.chart, report: buildReport(k.chart, lang) } : null,
    vastu: v && vInput ? { id: v.id, title: v.title, hasImage: Boolean(v.image_path), input: vInput, report: buildVastuReport(vInput, lang) } : null,
    combined: k ? buildCombinedReport(k.chart, vInput, lang) : null,
  });
});
