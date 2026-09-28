import { colors } from "./theme";
import type { ElementName, Rating, RoomType, Zone } from "./types";

export const ZONES: Zone[] = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
export const ZONE_ELEMENT: Record<Zone, ElementName> = {
  N: "water", NNE: "water", NE: "water", ENE: "air", E: "air", ESE: "air", SE: "fire", SSE: "fire",
  S: "fire", SSW: "earth", SW: "earth", WSW: "earth", W: "space", WNW: "space", NW: "air", NNW: "water",
};
export const ROOM_TYPES: RoomType[] = ["entrance", "living", "kitchen", "masterBedroom", "bedroom", "toilet", "pooja", "dining", "study", "staircase", "store"];

export const ROOM_COLOR: Record<RoomType, string> = {
  entrance: "#7A1F1F", living: "#1F5E7A", dining: "#6B8E23", kitchen: "#E8751A", masterBedroom: "#8E44AD", bedroom: "#B05FA3",
  toilet: "#5D6D7E", pooja: "#D4A017", study: "#2E86AB", staircase: "#8D6E63", store: "#A1887F",
};

export const RATING_COLOR: Record<Rating, { fg: string; bg: string }> = {
  excellent: { fg: colors.tulsi, bg: colors.tulsiSoft },
  good: { fg: "#5B7F1E", bg: "#EEF5DA" },
  neutral: { fg: colors.inkSoft, bg: colors.sandal },
  avoid: { fg: "#A15C00", bg: colors.haldiSoft },
  bad: { fg: colors.sindoor, bg: colors.sindoorSoft },
};

/** Same maths as the backend (vastu/grid.ts) so the live preview matches the analysis. */
export function locateZone(x: number, y: number, center: { x: number; y: number }, northAngle: number, aspectRatio: number): Zone | "C" {
  const w = aspectRatio >= 1 ? 1 : aspectRatio;
  const h = aspectRatio >= 1 ? 1 / aspectRatio : 1;
  const scale = 1 / Math.min(w, h);
  const dx = (x - center.x) * w * scale;
  const dy = (y - center.y) * h * scale;
  if (Math.hypot(dx, dy) < 0.12) return "C";
  const imageAngle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  const bearing = (imageAngle - northAngle + 360) % 360;
  return ZONES[Math.floor(((bearing + 11.25) % 360) / 22.5) % 16];
}
