import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { config } from "../config.js";
import { requireAuth, userIdOf } from "../auth/jwt.js";
import { getUser, publicUser } from "../auth/users.js";
import { getDb } from "../db/index.js";
import { logActivity } from "../lib/activity.js";

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get("/", (req, res) => {
  const id = userIdOf(req);
  const db = getDb();
  const count = (sql: string) => (db.prepare(sql).get(id) as { n: number }).n;
  res.json({
    user: publicUser(getUser(id)!),
    stats: {
      kundalis: count("SELECT COUNT(*) AS n FROM kundalis WHERE user_id = ?"),
      vastu: count("SELECT COUNT(*) AS n FROM vastu_records WHERE user_id = ?"),
      consultations: count("SELECT COUNT(*) AS n FROM consultations WHERE user_id = ?"),
    },
  });
});

meRouter.patch("/", (req, res) => {
  const body = z.object({ name: z.string().trim().min(1).max(120).optional(), language: z.enum(["en", "hi", "mr"]).optional() }).parse(req.body);
  const id = userIdOf(req);
  if (body.name) getDb().prepare("UPDATE users SET name = ? WHERE id = ?").run(body.name, id);
  if (body.language) getDb().prepare("UPDATE users SET language = ? WHERE id = ?").run(body.language, id);
  logActivity(req, id, "profile.update", undefined, body);
  res.json({ user: publicUser(getUser(id)!) });
});

/** Account deletion (required by App Store / Play Store policies). Removes all records and uploaded plans. */
meRouter.delete("/", (req, res) => {
  const id = userIdOf(req);
  const db = getDb();
  const images = db.prepare("SELECT image_path FROM vastu_records WHERE user_id = ? AND image_path IS NOT NULL").all(id) as { image_path: string }[];
  for (const { image_path } of images) fs.rm(path.join(config.uploadDir, path.basename(image_path)), { force: true }, () => {});
  db.prepare("DELETE FROM users WHERE id = ?").run(id); // cascades to all user-owned rows
  logActivity(req, null, "account.delete", { type: "user", id });
  res.status(204).end();
});
