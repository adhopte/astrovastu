export const ZONES = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"] as const;
export type Zone = (typeof ZONES)[number];
export type ZoneOrCenter = Zone | "C";

export const ZONE_ELEMENT: Record<Zone, "water" | "air" | "fire" | "earth" | "space"> = {
  N: "water", NNE: "water", NE: "water", ENE: "air", E: "air", ESE: "air", SE: "fire", SSE: "fire",
  S: "fire", SSW: "earth", SW: "earth", WSW: "earth", W: "space", WNW: "space", NW: "air", NNW: "water",
};

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const SPAN = 360 / 16;

/** Compass bearing (0 = N, clockwise) → zone. Each zone is centred on its direction (N = 348.75°–11.25°). */
export function zoneForBearing(bearing: number): Zone {
  return ZONES[Math.floor(norm360(bearing + SPAN / 2) / SPAN) % 16];
}

export interface GridSpec {
  /** Point of the plan treated as the Brahmasthan, normalised 0..1 in image space. */
  center: { x: number; y: number };
  /** Clockwise angle in degrees from the image's "up" to true North as marked by the user. */
  northAngle: number;
  /** width / height of the image. */
  aspectRatio: number;
  /** Radius of the Brahmasthan as a fraction of the smaller image side. */
  centerRadius?: number;
}

export interface PlacedPoint {
  x: number;
  y: number;
}

/** Locate a point (normalised image coordinates) on the 16-zone grid. */
export function locate(point: PlacedPoint, grid: GridSpec) {
  const w = grid.aspectRatio >= 1 ? 1 : grid.aspectRatio;
  const h = grid.aspectRatio >= 1 ? 1 / grid.aspectRatio : 1;
  // Scale to proportional units where the smaller side = 1.
  const scale = 1 / Math.min(w, h);
  const dx = (point.x - grid.center.x) * w * scale;
  const dy = (point.y - grid.center.y) * h * scale;
  const distance = Math.hypot(dx, dy);
  const imageAngle = norm360((Math.atan2(dx, -dy) * 180) / Math.PI);
  const bearing = norm360(imageAngle - grid.northAngle);
  const zone: ZoneOrCenter = distance < (grid.centerRadius ?? 0.12) ? "C" : zoneForBearing(bearing);
  return { bearing, distance, zone };
}

/**
 * Sector geometry for drawing the circular grid over the plan. Angles are in
 * image space (clockwise from up), so a client just rotates by these values.
 */
export function gridSectors(grid: GridSpec) {
  return ZONES.map((zone, i) => {
    const mid = i * SPAN;
    return {
      zone,
      element: ZONE_ELEMENT[zone],
      bearingStart: norm360(mid - SPAN / 2),
      bearingEnd: norm360(mid + SPAN / 2),
      imageStart: norm360(mid - SPAN / 2 + grid.northAngle),
      imageEnd: norm360(mid + SPAN / 2 + grid.northAngle),
      imageMid: norm360(mid + grid.northAngle),
    };
  });
}
