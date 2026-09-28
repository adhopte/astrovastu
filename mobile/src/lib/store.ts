// The app's entire local data layer. There is no server: everything here
// reads and writes the on-device SQLite database (lib/db.ts) and, for
// floor-plan photos, the app's own file storage (lib/files.ts).
import { getDb } from "./db";
import { uuid } from "./id";
import { deleteFloorPlanImage, saveFloorPlanImage } from "./files";
import { buildKundali, type BirthInput, type Kundali } from "@/domain/astro/kundali";
import { buildReport } from "@/domain/astro/predictions";
import type { Lang } from "@/domain/astro/content/types";
import { buildVastuReport, type RoomMark, type VastuInput } from "@/domain/vastu/analysis";
import { buildCombinedReport } from "@/domain/vastu/combined";
import type {
  ActivityItem, ConsultationDetail, ConsultationSummary, KundaliDetail, KundaliSummary, VastuDetail, VastuDraft, VastuSummary,
} from "./types";

const now = () => new Date().toISOString();

/* ---------------------------------- profile ---------------------------------- */

export interface ProfileRow {
  name: string;
  language: Lang;
  createdAt: string;
}

interface ProfileRawRow {
  name: string;
  language: string;
  created_at: string;
}

export function getProfile(): ProfileRow | null {
  const row = getDb().getFirstSync<ProfileRawRow>("SELECT name, language, created_at FROM profile WHERE id = 1");
  return row ? { name: row.name, language: row.language as Lang, createdAt: row.created_at } : null;
}

export function saveProfile(name: string, language: Lang): ProfileRow {
  const db = getDb();
  if (getProfile()) db.runSync("UPDATE profile SET name = ?, language = ? WHERE id = 1", name, language);
  else db.runSync("INSERT INTO profile (id, name, language, created_at) VALUES (1, ?, ?, ?)", name, language, now());
  return getProfile()!;
}

export function setProfileLanguage(language: Lang) {
  if (getProfile()) getDb().runSync("UPDATE profile SET language = ? WHERE id = 1", language);
}

/* --------------------------------- activity ---------------------------------- */

export type ActivityAction =
  | "profile.create"
  | "profile.update"
  | "data.reset"
  | "kundali.create"
  | "kundali.view"
  | "kundali.delete"
  | "vastu.create"
  | "vastu.view"
  | "vastu.delete"
  | "consultation.create"
  | "consultation.view";

export function logActivity(action: ActivityAction, entity?: { type: string; id: string }, metadata?: Record<string, unknown>) {
  getDb().runSync(
    "INSERT INTO activity_log (action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?)",
    action,
    entity?.type ?? null,
    entity?.id ?? null,
    metadata ? JSON.stringify(metadata) : null,
    now(),
  );
}

interface ActivityRawRow {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata_json: string | null;
  created_at: string;
}

const toActivityItem = (r: ActivityRawRow): ActivityItem => ({
  id: r.id,
  action: r.action,
  entityType: r.entity_type,
  entityId: r.entity_id,
  metadata: r.metadata_json ? JSON.parse(r.metadata_json) : null,
  createdAt: r.created_at,
});

export function listActivity(limit: number, before?: number): { items: ActivityItem[]; nextCursor: number | null } {
  const db = getDb();
  const rows = before
    ? db.getAllSync<ActivityRawRow>("SELECT * FROM activity_log WHERE id < ? ORDER BY id DESC LIMIT ?", before, limit)
    : db.getAllSync<ActivityRawRow>("SELECT * FROM activity_log ORDER BY id DESC LIMIT ?", limit);
  const items = rows.map(toActivityItem);
  return { items, nextCursor: items.length === limit ? items[items.length - 1].id : null };
}

/* --------------------------------- kundalis ----------------------------------- */

interface KundaliRow {
  id: string;
  name: string;
  gender: string | null;
  birth_date: string;
  birth_time: string;
  place_name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  chart_json: string;
  created_at: string;
}

function kundaliSummary(r: KundaliRow): KundaliSummary {
  const chart = JSON.parse(r.chart_json) as Kundali;
  return {
    id: r.id,
    name: r.name,
    gender: r.gender,
    birthDate: r.birth_date,
    birthTime: r.birth_time,
    placeName: r.place_name,
    lagnaSign: chart.ascendant.sign,
    moonSign: chart.moonSign,
    nakshatra: chart.planets.find((p) => p.id === "moon")!.nakshatra,
    createdAt: r.created_at,
  };
}

export function createKundali(input: BirthInput): { id: string; chart: Kundali } {
  const chart = buildKundali(input);
  const id = uuid();
  getDb().runSync(
    `INSERT INTO kundalis (id, name, gender, birth_date, birth_time, place_name, latitude, longitude, timezone, chart_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name,
    input.gender ?? null,
    input.birthDate,
    input.birthTime,
    input.placeName,
    input.latitude,
    input.longitude,
    input.timezone,
    JSON.stringify(chart),
    now(),
  );
  return { id, chart };
}

export const listKundalis = (): KundaliSummary[] =>
  getDb().getAllSync<KundaliRow>("SELECT * FROM kundalis ORDER BY created_at DESC").map(kundaliSummary);

export function getKundali(id: string, lang: Lang): KundaliDetail | null {
  const row = getDb().getFirstSync<KundaliRow>("SELECT * FROM kundalis WHERE id = ?", id);
  if (!row) return null;
  const stored = JSON.parse(row.chart_json) as Kundali;
  // Recompute so the "current" dasha/antardasha markers and Sade Sati stay accurate to today.
  const chart = buildKundali(stored.input);
  return { id: row.id, record: kundaliSummary(row), chart, report: buildReport(chart, lang) };
}

export const deleteKundali = (id: string): boolean => getDb().runSync("DELETE FROM kundalis WHERE id = ?", id).changes > 0;

/* ---------------------------------- vastu -------------------------------------- */

interface VastuRow {
  id: string;
  title: string;
  image_path: string | null;
  image_aspect: number;
  north_angle: number;
  center_x: number;
  center_y: number;
  rooms_json: string;
  score: number;
  created_at: string;
}

const toVastuInput = (r: VastuRow): VastuInput => ({
  grid: { center: { x: r.center_x, y: r.center_y }, northAngle: r.north_angle, aspectRatio: r.image_aspect },
  rooms: JSON.parse(r.rooms_json) as RoomMark[],
});

const vastuSummary = (r: VastuRow): VastuSummary => ({
  id: r.id,
  title: r.title,
  score: r.score,
  rooms: (JSON.parse(r.rooms_json) as RoomMark[]).length,
  hasImage: Boolean(r.image_path),
  imageUri: r.image_path,
  northAngle: r.north_angle,
  createdAt: r.created_at,
});

export async function createVastu(draft: VastuDraft): Promise<{ id: string; input: VastuInput }> {
  const id = uuid();
  const imagePath = draft.imageUri ? await saveFloorPlanImage(draft.imageUri, id, draft.mimeType) : null;
  const input: VastuInput = { grid: { center: draft.center, northAngle: draft.northAngle, aspectRatio: draft.aspectRatio }, rooms: draft.rooms };
  const report = buildVastuReport(input, "en");
  getDb().runSync(
    `INSERT INTO vastu_records (id, title, image_path, image_aspect, north_angle, center_x, center_y, rooms_json, score, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    draft.title,
    imagePath,
    draft.aspectRatio,
    draft.northAngle,
    draft.center.x,
    draft.center.y,
    JSON.stringify(draft.rooms),
    report.score,
    now(),
  );
  return { id, input };
}

export const listVastu = (): VastuSummary[] =>
  getDb().getAllSync<VastuRow>("SELECT * FROM vastu_records ORDER BY created_at DESC").map(vastuSummary);

export function getVastu(id: string, lang: Lang): VastuDetail | null {
  const row = getDb().getFirstSync<VastuRow>("SELECT * FROM vastu_records WHERE id = ?", id);
  if (!row) return null;
  const input = toVastuInput(row);
  return { id: row.id, record: vastuSummary(row), input, report: buildVastuReport(input, lang) };
}

export function deleteVastu(id: string): boolean {
  const row = getDb().getFirstSync<VastuRow>("SELECT * FROM vastu_records WHERE id = ?", id);
  if (!row) return false;
  getDb().runSync("DELETE FROM vastu_records WHERE id = ?", id);
  deleteFloorPlanImage(row.image_path);
  return true;
}

/** For the vastu image `<Image>` source: the file already lives on-device, no auth or fetch needed. */
export function getVastuImageUri(id: string): string | null {
  const row = getDb().getFirstSync<{ image_path: string | null }>("SELECT image_path FROM vastu_records WHERE id = ?", id);
  return row?.image_path ?? null;
}

/* ------------------------------- consultations --------------------------------- */

interface ConsultationRow {
  id: string;
  kind: "astro" | "vastu" | "both";
  kundali_id: string | null;
  vastu_id: string | null;
  created_at: string;
}

export function createConsultation(kind: ConsultationRow["kind"], kundaliId: string | null, vastuId: string | null): string {
  const id = uuid();
  getDb().runSync("INSERT INTO consultations (id, kind, kundali_id, vastu_id, created_at) VALUES (?, ?, ?, ?, ?)", id, kind, kundaliId, vastuId, now());
  return id;
}

interface ConsultationListRow extends ConsultationRow {
  kundali_name: string | null;
  vastu_title: string | null;
  vastu_score: number | null;
}

export function listConsultations(): ConsultationSummary[] {
  const rows = getDb().getAllSync<ConsultationListRow>(
    `SELECT c.id, c.kind, c.kundali_id, c.vastu_id, c.created_at, k.name AS kundali_name, v.title AS vastu_title, v.score AS vastu_score
     FROM consultations c LEFT JOIN kundalis k ON k.id = c.kundali_id LEFT JOIN vastu_records v ON v.id = c.vastu_id
     ORDER BY c.created_at DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    kundaliId: r.kundali_id,
    vastuId: r.vastu_id,
    kundaliName: r.kundali_name,
    vastuTitle: r.vastu_title,
    vastuScore: r.vastu_score,
    createdAt: r.created_at,
  }));
}

export function getConsultation(id: string, lang: Lang): ConsultationDetail | null {
  const row = getDb().getFirstSync<ConsultationRow>("SELECT * FROM consultations WHERE id = ?", id);
  if (!row) return null;
  const k = row.kundali_id ? getKundali(row.kundali_id, lang) : null;
  const v = row.vastu_id ? getVastu(row.vastu_id, lang) : null;
  return {
    id: row.id,
    kind: row.kind,
    createdAt: row.created_at,
    kundali: k ? { id: k.id, name: k.record.name, chart: k.chart, report: k.report } : null,
    vastu: v ? { id: v.id, title: v.record.title, hasImage: v.record.hasImage, imageUri: v.record.imageUri, input: v.input, report: v.report } : null,
    combined: k ? buildCombinedReport(k.chart, v ? v.input : null, lang) : null,
  };
}

/** Backs the "Consult Astro + Vastu" flow: reuse or create each half, then link them. */
export async function createCombinedConsultation(
  birth: BirthInput | { kundaliId: string },
  vastu: VastuDraft | { vastuId: string },
): Promise<{ id: string; kundaliId: string; vastuId: string }> {
  const kundaliId = "kundaliId" in birth ? birth.kundaliId : createKundali(birth).id;
  const vastuId = "vastuId" in vastu ? vastu.vastuId : (await createVastu(vastu)).id;
  const id = createConsultation("both", kundaliId, vastuId);
  return { id, kundaliId, vastuId };
}

/* ----------------------------------- misc --------------------------------------- */

export function getStats() {
  const db = getDb();
  const count = (sql: string) => db.getFirstSync<{ n: number }>(sql)?.n ?? 0;
  return {
    kundalis: count("SELECT COUNT(*) AS n FROM kundalis"),
    vastu: count("SELECT COUNT(*) AS n FROM vastu_records"),
    consultations: count("SELECT COUNT(*) AS n FROM consultations"),
  };
}

/** "Clear all data" in Profile: wipes every table and any stored floor-plan photos. */
export function clearAllData() {
  const db = getDb();
  for (const r of db.getAllSync<{ image_path: string | null }>("SELECT image_path FROM vastu_records WHERE image_path IS NOT NULL")) {
    deleteFloorPlanImage(r.image_path);
  }
  db.execSync("DELETE FROM activity_log; DELETE FROM consultations; DELETE FROM vastu_records; DELETE FROM kundalis; DELETE FROM profile;");
}
