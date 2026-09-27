import type { Lang } from "../astro/content/types.js";
import { VASTU_CONTENT } from "./content/index.js";
import { GridSpec, ZONE_ELEMENT, ZONES, Zone, ZoneOrCenter, gridSectors, locate } from "./grid.js";
import { ROOM_TYPES, ROOM_WEIGHT, Rating, RoomType, idealZones, ratingFor, scoreFor } from "./rules.js";

export interface RoomMark {
  id?: string;
  type: RoomType;
  label?: string;
  x: number; // normalised 0..1
  y: number;
}

export interface VastuInput {
  grid: GridSpec;
  rooms: RoomMark[];
}

export interface RoomFinding {
  id?: string;
  type: RoomType;
  name: string;
  label?: string;
  x: number;
  y: number;
  zone: ZoneOrCenter;
  zoneName: string;
  bearing: number;
  score: number;
  rating: Rating;
  ratingLabel: string;
  finding: string;
  ideal: string;
  remedies: string[];
}

export interface VastuReport {
  lang: Lang;
  score: number; // 0..100
  verdict: string;
  findings: RoomFinding[];
  zones: { zone: Zone; name: string; element: string; attr: string; rooms: RoomType[]; status: "good" | "neutral" | "afflicted" | "empty" }[];
  center: { rooms: RoomType[]; afflicted: boolean; note: string };
  missing: string[];
  tips: string[];
  sectors: ReturnType<typeof gridSectors>;
  disclaimer: string;
}

/** Deterministic Vastu computation; stored as-is and re-localised on read. */
export function computeVastu(input: VastuInput) {
  return input.rooms.map((r) => {
    const loc = locate(r, input.grid);
    return { ...r, zone: loc.zone, bearing: Math.round(loc.bearing * 10) / 10, score: scoreFor(r.type, loc.zone) };
  });
}

export function buildVastuReport(input: VastuInput, lang: Lang): VastuReport {
  const c = VASTU_CONTENT[lang];
  const placed = computeVastu(input);

  const findings: RoomFinding[] = placed.map((p) => {
    const rating = ratingFor(p.score);
    const zoneName = c.zoneNames[p.zone];
    const remedies: string[] = [];
    if (p.score < 0) {
      remedies.push(c.roomRemedies[p.type]);
      remedies.push(p.zone === "C" ? c.centerRemedy : c.elementRemedy[ZONE_ELEMENT[p.zone]]);
    }
    return {
      id: p.id,
      type: p.type,
      name: c.rooms[p.type],
      label: p.label,
      x: p.x,
      y: p.y,
      zone: p.zone,
      zoneName,
      bearing: p.bearing,
      score: p.score,
      rating,
      ratingLabel: c.ratings[rating],
      finding: c.finding[rating](c.rooms[p.type], zoneName, c.zoneAttr[p.zone]),
      ideal: c.ideal(c.rooms[p.type], idealZones(p.type).map((z) => c.zoneNames[z]).join(", ")),
      remedies,
    };
  });

  let total = 0;
  let weight = 0;
  for (const f of findings) {
    total += ((f.score + 2) / 4) * ROOM_WEIGHT[f.type];
    weight += ROOM_WEIGHT[f.type];
  }
  // A major dosha (e.g. toilet in the North-East) weighs more than the average suggests.
  const doshaCount = findings.filter((f) => f.score === -2).length;
  const score = weight ? Math.max(0, Math.round((total / weight) * 100) - doshaCount * 8) : 0;
  const verdict = score >= 80 ? c.verdict.excellent : score >= 65 ? c.verdict.good : score >= 45 ? c.verdict.fair : c.verdict.poor;

  const zones = ZONES.map((zone) => {
    const here = placed.filter((p) => p.zone === zone);
    const worst = here.length ? Math.min(...here.map((h) => h.score)) : null;
    const status: VastuReport["zones"][number]["status"] = worst === null ? "empty" : worst <= -1 ? "afflicted" : worst >= 1 ? "good" : "neutral";
    return { zone, name: c.zoneNames[zone], element: c.elements[ZONE_ELEMENT[zone]], attr: c.zoneAttr[zone], rooms: here.map((h) => h.type), status };
  });

  const centerRooms = placed.filter((p) => p.zone === "C");
  const essential: RoomType[] = ["entrance", "kitchen", "masterBedroom", "toilet", "living"];
  const present = new Set(placed.map((p) => p.type));

  return {
    lang,
    score,
    verdict,
    findings: findings.sort((a, b) => a.score - b.score),
    zones,
    center: { rooms: centerRooms.map((r) => r.type), afflicted: centerRooms.some((r) => r.score < 0), note: c.centerRemedy },
    missing: essential.filter((t) => !present.has(t)).map((t) => c.missing(c.rooms[t])),
    tips: c.generalTips,
    sectors: gridSectors(input.grid),
    disclaimer: c.disclaimer,
  };
}

export { ROOM_TYPES };
