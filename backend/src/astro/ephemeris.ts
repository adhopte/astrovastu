import * as Astronomy from "astronomy-engine";

export const PLANETS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"] as const;
export type PlanetId = (typeof PLANETS)[number];

const BODY: Partial<Record<PlanetId, Astronomy.Body>> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mars: Astronomy.Body.Mars,
  mercury: Astronomy.Body.Mercury,
  jupiter: Astronomy.Body.Jupiter,
  venus: Astronomy.Body.Venus,
  saturn: Astronomy.Body.Saturn,
};

const DEG = Math.PI / 180;

export const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Julian centuries since J2000.0 (TT approximated by UT; sub-minute error is irrelevant here). */
function julianCenturies(date: Date): number {
  return Astronomy.MakeTime(date).tt / 36525;
}

/**
 * Lahiri (Chitrapaksha) ayanamsa. Linear model anchored at J2000 (23°51'11")
 * with the IAU general precession rate; accurate to well under an arc-minute
 * for dates between 1900 and 2100.
 */
export function lahiriAyanamsa(date: Date): number {
  const T = julianCenturies(date);
  return 23.853055 + (5028.796195 * T + 1.1054348 * T * T) / 3600;
}

/** Mean lunar ascending node (Rahu), tropical, Meeus 47.7. */
function meanNode(date: Date): number {
  const T = julianCenturies(date);
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441);
}

/** Tropical (ecliptic-of-date) geocentric longitude. */
function tropicalLongitude(id: PlanetId, date: Date): number {
  if (id === "rahu") return meanNode(date);
  if (id === "ketu") return norm360(meanNode(date) + 180);
  if (id === "sun") return Astronomy.SunPosition(date).elon;
  if (id === "moon") return Astronomy.EclipticGeoMoon(date).lon;
  const vec = Astronomy.GeoVector(BODY[id]!, date, true);
  return Astronomy.Ecliptic(vec).elon;
}

export interface RawPosition {
  id: PlanetId;
  tropical: number;
  sidereal: number;
  speed: number; // degrees per day (sidereal frame ≈ tropical frame for speed)
  retrograde: boolean;
}

export function planetPositions(date: Date): RawPosition[] {
  const ayan = lahiriAyanamsa(date);
  const next = new Date(date.getTime() + 12 * 3600 * 1000);
  const prev = new Date(date.getTime() - 12 * 3600 * 1000);
  return PLANETS.map((id) => {
    const tropical = tropicalLongitude(id, date);
    let delta = tropicalLongitude(id, next) - tropicalLongitude(id, prev);
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const retrograde = id === "rahu" || id === "ketu" ? true : delta < 0;
    return { id, tropical, sidereal: norm360(tropical - ayan), speed: delta, retrograde };
  });
}

/** Tropical ascendant and MC for a geographic location. */
export function ascendantAndMc(date: Date, latitude: number, longitude: number) {
  const gast = Astronomy.SiderealTime(date); // hours
  const ramc = norm360(gast * 15 + longitude) * DEG;
  const eps = Astronomy.e_tilt(Astronomy.MakeTime(date)).tobl * DEG;
  const phi = latitude * DEG;
  const asc = norm360(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / DEG);
  const mc = norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / DEG);
  return { ascendant: asc, mc };
}

export function siderealAscendant(date: Date, latitude: number, longitude: number) {
  const { ascendant, mc } = ascendantAndMc(date, latitude, longitude);
  const ayan = lahiriAyanamsa(date);
  return { ascendant: norm360(ascendant - ayan), mc: norm360(mc - ayan), ayanamsa: ayan };
}
