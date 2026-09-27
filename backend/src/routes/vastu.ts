import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { config } from "../config.js";
import { requireAuth, userIdOf } from "../auth/jwt.js";
import { getDb } from "../db/index.js";
import { buildVastuReport, VastuInput } from "../vastu/analysis.js";
import { ROOM_TYPES } from "../vastu/rules.js";
import { HttpError } from "../lib/http.js";
import { logActivity } from "../lib/activity.js";
import { langOf } from "../lib/lang.js";
import { planUpload, requireImage, saveImage, sniffImage } from "../lib/upload.js";
import { aiAvailable, aiDetectRooms } from "../ai/claude.js";

export const vastuRouter = Router();
vastuRouter.use(requireAuth);

const unit = z.number().min(0).max(1);
export const vastuSchema = z.object({
  title: z.string().trim().min(1).max(120),
  northAngle: z.number().min(-360).max(360).transform((a) => ((a % 360) + 360) % 360),
  aspectRatio: z.number().positive().max(20),
  center: z.object({ x: unit, y: unit }).default({ x: 0.5, y: 0.5 }),
  rooms: z
    .array(z.object({ id: z.string().max(64).optional(), type: z.enum(ROOM_TYPES), label: z.string().max(60).optional(), x: unit, y: unit }))
    .min(1)
    .max(60),
  aiDetected: z.boolean().optional(),
});
export type VastuBody = z.infer<typeof vastuSchema>;

interface VastuRow {
  id: string;
  user_id: string;
  title: string;
  image_path: string | null;
  image_aspect: number;
  north_angle: number;
  center_x: number;
  center_y: number;
  rooms_json: string;
  score: number;
  ai_detected: number;
  created_at: string;
}

export const toInput = (r: VastuRow): VastuInput => ({
  grid: { center: { x: r.center_x, y: r.center_y }, northAngle: r.north_angle, aspectRatio: r.image_aspect },
  rooms: JSON.parse(r.rooms_json),
});

export function loadVastu(userId: string, id: string): VastuRow {
  const row = getDb().prepare("SELECT * FROM vastu_records WHERE id = ? AND user_id = ?").get(id, userId) as VastuRow | undefined;
  if (!row) throw new HttpError(404, "Vastu record not found", "not_found");
  return row;
}

const summary = (r: VastuRow) => ({
  id: r.id, title: r.title, score: r.score, rooms: JSON.parse(r.rooms_json).length as number, hasImage: Boolean(r.image_path),
  northAngle: r.north_angle, aiDetected: Boolean(r.ai_detected), createdAt: r.created_at,
});

/** Body arrives either as JSON, or as multipart with a JSON `data` field and a `plan` image. */
function parseBody(raw: unknown): VastuBody {
  const obj = typeof (raw as { data?: unknown })?.data === "string" ? JSON.parse((raw as { data: string }).data) : raw;
  return vastuSchema.parse(obj);
}

export function createVastuRecord(userId: string, body: VastuBody, file?: Express.Multer.File) {
  const imagePath = file ? (({ buf, type }) => saveImage(buf, type))(requireImage(file)) : null;
  const input: VastuInput = { grid: { center: body.center, northAngle: body.northAngle, aspectRatio: body.aspectRatio }, rooms: body.rooms };
  const report = buildVastuReport(input, "en");
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO vastu_records (id, user_id, title, image_path, image_aspect, north_angle, center_x, center_y, rooms_json, score, ai_detected, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, userId, body.title, imagePath, body.aspectRatio, body.northAngle, body.center.x, body.center.y, JSON.stringify(body.rooms), report.score, body.aiDetected ? 1 : 0, new Date().toISOString());
  return { id, input };
}

vastuRouter.post("/", planUpload.single("plan"), (req, res) => {
  const userId = userIdOf(req);
  const body = parseBody(req.body);
  const { id, input } = createVastuRecord(userId, body, req.file);
  getDb().prepare("INSERT INTO consultations (id, user_id, kind, vastu_id, created_at) VALUES (?, ?, 'vastu', ?, ?)").run(randomUUID(), userId, id, new Date().toISOString());
  const report = buildVastuReport(input, langOf(req));
  logActivity(req, userId, "vastu.create", { type: "vastu", id }, { title: body.title, rooms: body.rooms.length, score: report.score });
  res.status(201).json({ id, report });
});

vastuRouter.post("/detect", planUpload.single("plan"), async (req, res) => {
  const userId = userIdOf(req);
  const { buf, type } = requireImage(req.file);
  const detection = await aiDetectRooms(buf, type);
  logActivity(req, userId, "vastu.ai_detect", undefined, { rooms: detection.rooms.length });
  res.json(detection);
});

vastuRouter.get("/", (req, res) => {
  const rows = getDb().prepare("SELECT * FROM vastu_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 200").all(userIdOf(req)) as unknown as VastuRow[];
  res.json({ items: rows.map(summary), aiAvailable: aiAvailable() });
});

vastuRouter.get("/:id", (req, res) => {
  const userId = userIdOf(req);
  const row = loadVastu(userId, req.params.id);
  logActivity(req, userId, "vastu.view", { type: "vastu", id: row.id });
  const input = toInput(row);
  res.json({ id: row.id, record: summary(row), input, report: buildVastuReport(input, langOf(req)) });
});

vastuRouter.get("/:id/image", (req, res) => {
  const row = loadVastu(userIdOf(req), req.params.id);
  if (!row.image_path) throw new HttpError(404, "No image for this record", "not_found");
  const file = path.resolve(config.uploadDir, path.basename(row.image_path));
  if (!fs.existsSync(file)) throw new HttpError(404, "Image missing", "not_found");
  const head = Buffer.alloc(16);
  const fd = fs.openSync(file, "r");
  fs.readSync(fd, head, 0, 16, 0);
  fs.closeSync(fd);
  res.type(sniffImage(head) ?? "application/octet-stream");
  res.set("Cache-Control", "private, max-age=86400");
  res.sendFile(file);
});

vastuRouter.delete("/:id", (req, res) => {
  const userId = userIdOf(req);
  const row = loadVastu(userId, req.params.id);
  getDb().prepare("DELETE FROM vastu_records WHERE id = ?").run(row.id);
  if (row.image_path) fs.rm(path.join(config.uploadDir, path.basename(row.image_path)), { force: true }, () => {});
  logActivity(req, userId, "vastu.delete", { type: "vastu", id: row.id });
  res.status(204).end();
});
