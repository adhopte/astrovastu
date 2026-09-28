// UI-only constants (colours) plus a thin wrapper around the domain grid
// maths, used for the live marker preview while tagging rooms.
import { locate, ZONE_ELEMENT, ZONES } from "@/domain/vastu/grid";
import { colors } from "./theme";
import type { Rating, RoomType, ZoneOrCenter } from "./types";

export { ZONES, ZONE_ELEMENT };

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

/** Same maths as the analysis engine (src/domain/vastu/grid.ts) so the live preview matches the saved report. */
export function locateZone(x: number, y: number, center: { x: number; y: number }, northAngle: number, aspectRatio: number): ZoneOrCenter {
  return locate({ x, y }, { center, northAngle, aspectRatio }).zone;
}
