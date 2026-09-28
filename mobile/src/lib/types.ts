// Local-record shapes for on-device storage and list views. The heavier
// computed types (charts, reports) live with the engines in src/domain and
// are re-exported here so the rest of the app has one place to import from.
import type { Kundali } from "@/domain/astro/kundali";
import type { KundaliReport } from "@/domain/astro/predictions";
import type { VastuInput, VastuReport, RoomMark } from "@/domain/vastu/analysis";
import type { CombinedReport } from "@/domain/vastu/combined";

export type { Lang } from "@/domain/astro/content/types";
export type { PlanetId } from "@/domain/astro/ephemeris";
export type { Dignity, BirthInput } from "@/domain/astro/kundali";
export type { Kundali as Chart } from "@/domain/astro/kundali";
export type { KundaliReport } from "@/domain/astro/predictions";
export type { Zone, ZoneOrCenter } from "@/domain/vastu/grid";
export type { RoomType, Rating } from "@/domain/vastu/rules";
export type { VastuInput, VastuReport, RoomMark, RoomFinding } from "@/domain/vastu/analysis";
export type { CombinedReport } from "@/domain/vastu/combined";
export type { Place } from "@/domain/geo/cities";

export interface KundaliSummary {
  id: string;
  name: string;
  gender: string | null;
  birthDate: string;
  birthTime: string;
  placeName: string;
  lagnaSign: number;
  moonSign: number;
  nakshatra: number;
  createdAt: string;
}

export interface KundaliDetail {
  id: string;
  record: KundaliSummary;
  chart: Kundali;
  report: KundaliReport;
}

export interface VastuSummary {
  id: string;
  title: string;
  score: number;
  rooms: number;
  hasImage: boolean;
  imageUri: string | null;
  northAngle: number;
  createdAt: string;
}

export interface VastuDetail {
  id: string;
  record: VastuSummary;
  input: VastuInput;
  report: VastuReport;
}

/** In-progress state of the "add a floor plan" wizard, before it's saved. */
export interface VastuDraft {
  title: string;
  imageUri: string | null;
  mimeType?: string;
  aspectRatio: number;
  northAngle: number;
  center: { x: number; y: number };
  rooms: RoomMark[];
}

export interface ConsultationDetail {
  id: string;
  kind: "astro" | "vastu" | "both";
  createdAt: string;
  kundali: { id: string; name: string; chart: Kundali; report: KundaliReport } | null;
  vastu: { id: string; title: string; hasImage: boolean; imageUri: string | null; input: VastuInput; report: VastuReport } | null;
  combined: CombinedReport | null;
}

export interface ConsultationSummary {
  id: string;
  kind: "astro" | "vastu" | "both";
  kundaliId: string | null;
  vastuId: string | null;
  kundaliName: string | null;
  vastuTitle: string | null;
  vastuScore: number | null;
  createdAt: string;
}

export interface ActivityItem {
  id: number;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
