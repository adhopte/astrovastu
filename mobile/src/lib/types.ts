// Shapes returned by the AstroVastu API (see backend/src).
export type Lang = "en" | "hi" | "mr";
export type PlanetId = "sun" | "moon" | "mars" | "mercury" | "jupiter" | "venus" | "saturn" | "rahu" | "ketu";
export type Dignity = "exalted" | "debilitated" | "own" | "friendly" | "neutral" | "enemy";
export type Zone = "N" | "NNE" | "NE" | "ENE" | "E" | "ESE" | "SE" | "SSE" | "S" | "SSW" | "SW" | "WSW" | "W" | "WNW" | "NW" | "NNW";
export type ZoneOrCenter = Zone | "C";
export type RoomType = "entrance" | "living" | "dining" | "kitchen" | "masterBedroom" | "bedroom" | "toilet" | "pooja" | "study" | "staircase" | "store";
export type Rating = "excellent" | "good" | "neutral" | "avoid" | "bad";
export type ElementName = "water" | "air" | "fire" | "earth" | "space";

export interface User {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  language: Lang;
  providers: string[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  created: boolean;
}

export interface Providers {
  google: boolean;
  facebook: boolean;
  apple: boolean;
  email: boolean;
  demo: boolean;
}

export interface Place {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface BirthInput {
  name: string;
  gender?: "male" | "female" | "other";
  birthDate: string;
  birthTime: string;
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface PlanetPlacement {
  id: PlanetId;
  longitude: number;
  sign: number;
  degreeInSign: number;
  house: number;
  nakshatra: number;
  pada: number;
  nakshatraLord: PlanetId;
  retrograde: boolean;
  combust: boolean;
  dignity: Dignity;
  navamsaSign: number;
}

export interface Chart {
  input: BirthInput;
  utc: string;
  utcOffsetMinutes: number;
  ayanamsa: number;
  ascendant: { longitude: number; sign: number; degreeInSign: number; nakshatra: number; pada: number; navamsaSign: number };
  planets: PlanetPlacement[];
  houses: { house: number; sign: number; lord: PlanetId; occupants: PlanetId[] }[];
  moonSign: number;
  sunSign: number;
  currentDasha: { mahadasha: PlanetId; antardasha: PlanetId; mahaEnd: string; antarEnd: string } | null;
}

export interface ReportSection {
  key: string;
  title: string;
  rating?: number;
  paragraphs: string[];
}

export interface DashaRow {
  lord: PlanetId;
  name: string;
  start: string;
  end: string;
  current: boolean;
  antardashas: { lord: PlanetId; name: string; start: string; end: string; current: boolean }[];
}

export interface KundaliReport {
  lang: Lang;
  labels: { signs: string[]; planets: Record<PlanetId, string>; nakshatras: string[]; houseTopics: string[] };
  summary: { lagna: string; moonSign: string; sunSign: string; nakshatra: string; pada: number; nakshatraLord: string };
  panchang: { tithi: string; paksha: string; vara: string; yoga: string; karana: string; nakshatra: string };
  sections: ReportSection[];
  yogas: { key: string; name: string; desc: string }[];
  doshas: { key: string; text: string; active: boolean }[];
  remedies: { planet: PlanetId; name: string; gem: string; mantra: string; day: string; color: string; charity: string; reason?: string }[];
  dashas: DashaRow[];
  disclaimer: string;
}

export interface AiReading {
  overview: string;
  highlights: { title: string; text: string }[];
  yearAhead: string;
  guidance: string[];
}

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
  chart: Chart;
  report: KundaliReport;
  aiReading: AiReading | null;
  aiAvailable: boolean;
}

export interface RoomMark {
  id?: string;
  type: RoomType;
  label?: string;
  x: number;
  y: number;
}

export interface VastuInput {
  grid: { center: { x: number; y: number }; northAngle: number; aspectRatio: number };
  rooms: RoomMark[];
}

export interface Sector {
  zone: Zone;
  element: ElementName;
  bearingStart: number;
  bearingEnd: number;
  imageStart: number;
  imageEnd: number;
  imageMid: number;
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
  score: number;
  verdict: string;
  findings: RoomFinding[];
  zones: { zone: Zone; name: string; element: string; attr: string; rooms: RoomType[]; status: "good" | "neutral" | "afflicted" | "empty" }[];
  center: { rooms: RoomType[]; afflicted: boolean; note: string };
  missing: string[];
  tips: string[];
  sectors: Sector[];
  disclaimer: string;
}

export interface VastuSummary {
  id: string;
  title: string;
  score: number;
  rooms: number;
  hasImage: boolean;
  northAngle: number;
  aiDetected: boolean;
  createdAt: string;
}

export interface VastuDetail {
  id: string;
  record: VastuSummary;
  input: VastuInput;
  report: VastuReport;
}

export interface VastuDraft {
  title: string;
  imageUri: string | null;
  mimeType?: string;
  aspectRatio: number;
  northAngle: number;
  center: { x: number; y: number };
  rooms: RoomMark[];
  aiDetected: boolean;
}

export interface CombinedReport {
  title: string;
  favourableZones: Zone[];
  paragraphs: string[];
  alerts: string[];
  supports: string[];
}

export interface ConsultationDetail {
  id: string;
  kind: "astro" | "vastu" | "both";
  createdAt: string;
  kundali: { id: string; name: string; chart: Chart; report: KundaliReport } | null;
  vastu: { id: string; title: string; hasImage: boolean; input: VastuInput; report: VastuReport } | null;
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

export interface AiDetection {
  northAngle: number | null;
  rooms: { type: RoomType; label: string; x: number; y: number }[];
  notes: string;
}
