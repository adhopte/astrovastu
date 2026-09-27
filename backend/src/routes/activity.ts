import { Router } from "express";
import { z } from "zod";
import { requireAuth, userIdOf } from "../auth/jwt.js";
import { getDb } from "../db/index.js";

export const activityRouter = Router();
activityRouter.use(requireAuth);

/** Paginated activity timeline for the signed-in user (newest first, cursor = last id). */
activityRouter.get("/", (req, res) => {
  const q = z.object({ limit: z.coerce.number().int().min(1).max(100).default(30), before: z.coerce.number().int().optional() }).parse(req.query);
  const rows = getDb()
    .prepare(
      `SELECT id, action, entity_type, entity_id, metadata_json, created_at FROM activity_log
       WHERE user_id = ? AND (? IS NULL OR id < ?) ORDER BY id DESC LIMIT ?`,
    )
    .all(userIdOf(req), q.before ?? null, q.before ?? null, q.limit) as { id: number; action: string; entity_type: string | null; entity_id: string | null; metadata_json: string | null; created_at: string }[];
  res.json({
    items: rows.map((r) => ({ id: r.id, action: r.action, entityType: r.entity_type, entityId: r.entity_id, metadata: r.metadata_json ? JSON.parse(r.metadata_json) : null, createdAt: r.created_at })),
    nextCursor: rows.length === q.limit ? rows[rows.length - 1].id : null,
  });
});

/** Aggregate counts per action per day, for an activity heat-map/summary. */
activityRouter.get("/summary", (req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT substr(created_at, 1, 10) AS day, action, COUNT(*) AS n FROM activity_log
       WHERE user_id = ? AND created_at >= ? GROUP BY day, action ORDER BY day DESC`,
    )
    .all(userIdOf(req), new Date(Date.now() - 90 * 86400_000).toISOString());
  res.json({ items: rows });
});
