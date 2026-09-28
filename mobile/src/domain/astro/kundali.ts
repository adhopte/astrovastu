import { DateTime } from "luxon";
import { PLANETS, PlanetId, norm360, planetPositions, siderealAscendant } from "./ephemeris";

/** Sign lords, indexed by sign 0 = Aries … 11 = Pisces. */
export const SIGN_LORD: PlanetId[] = ["mars", "venus", "mercury", "moon", "sun", "mercury", "venus", "mars", "jupiter", "saturn", "saturn", "jupiter"];
export const SIGN_ELEMENT = ["fire", "earth", "air", "water"] as const;
export type Element = (typeof SIGN_ELEMENT)[number];
export const signElement = (sign: number): Element => SIGN_ELEMENT[sign % 4];

const EXALTATION: Partial<Record<PlanetId, number>> = { sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6, rahu: 1, ketu: 7 };
const OWN_SIGNS: Partial<Record<PlanetId, number[]>> = {
  sun: [4], moon: [3], mars: [0, 7], mercury: [2, 5], jupiter: [8, 11], venus: [1, 6], saturn: [9, 10],
};
const FRIENDS: Record<string, PlanetId[]> = {
  sun: ["moon", "mars", "jupiter"], moon: ["sun", "mercury"], mars: ["sun", "moon", "jupiter"],
  mercury: ["sun", "venus"], jupiter: ["sun", "moon", "mars"], venus: ["mercury", "saturn"], saturn: ["mercury", "venus"],
};
const ENEMIES: Record<string, PlanetId[]> = {
  sun: ["venus", "saturn"], moon: [], mars: ["mercury"], mercury: ["moon"], jupiter: ["mercury", "venus"],
  venus: ["sun", "moon"], saturn: ["sun", "moon", "mars"],
};

export type Dignity = "exalted" | "debilitated" | "own" | "friendly" | "neutral" | "enemy";

export function dignity(planet: PlanetId, sign: number): Dignity {
  const ex = EXALTATION[planet];
  if (ex === sign) return "exalted";
  if (ex !== undefined && (ex + 6) % 12 === sign) return "debilitated";
  if (OWN_SIGNS[planet]?.includes(sign)) return "own";
  if (planet === "rahu" || planet === "ketu") return "neutral";
  const lord = SIGN_LORD[sign];
  if (FRIENDS[planet]?.includes(lord)) return "friendly";
  if (ENEMIES[planet]?.includes(lord)) return "enemy";
  return "neutral";
}

export const NAKSHATRA_LORDS: PlanetId[] = ["ketu", "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury"];
const NAK_SPAN = 360 / 27;

export function nakshatraOf(lon: number) {
  const index = Math.floor(lon / NAK_SPAN);
  const within = lon - index * NAK_SPAN;
  return { index, pada: Math.floor(within / (NAK_SPAN / 4)) + 1, lord: NAKSHATRA_LORDS[index % 9], fraction: within / NAK_SPAN };
}

/** D9 (Navamsa) sign for a sidereal longitude. */
export function navamsaSign(lon: number): number {
  const sign = Math.floor(lon / 30);
  const part = Math.floor((lon % 30) / (30 / 9));
  const start = [0, 9, 6, 3][sign % 4]; // movable/fixed/dual start from Aries, Capricorn, Libra, Cancer by element
  return (start + part) % 12;
}

export interface PlanetPlacement {
  id: PlanetId;
  longitude: number; // sidereal
  sign: number;
  degreeInSign: number;
  house: number; // 1..12 whole-sign from lagna
  nakshatra: number;
  pada: number;
  nakshatraLord: PlanetId;
  retrograde: boolean;
  combust: boolean;
  dignity: Dignity;
  navamsaSign: number;
}

export interface DashaPeriod {
  lord: PlanetId;
  start: string; // ISO date
  end: string;
  antardashas?: DashaPeriod[];
}

export interface BirthInput {
  name: string;
  gender?: "male" | "female" | "other";
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm (24h)
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA
}

export interface Kundali {
  input: BirthInput;
  utc: string;
  utcOffsetMinutes: number;
  ayanamsa: number;
  ascendant: { longitude: number; sign: number; degreeInSign: number; nakshatra: number; pada: number; navamsaSign: number };
  planets: PlanetPlacement[];
  houses: { house: number; sign: number; lord: PlanetId; occupants: PlanetId[] }[];
  panchang: { tithi: number; paksha: "shukla" | "krishna"; vara: number; yoga: number; karana: number; nakshatra: number };
  moonSign: number;
  sunSign: number;
  dashas: DashaPeriod[];
  currentDasha: { mahadasha: PlanetId; antardasha: PlanetId; mahaEnd: string; antarEnd: string } | null;
  yogas: string[];
  doshas: { manglik: boolean; manglikCancelled: boolean; kaalSarp: boolean; sadeSati: "none" | "rising" | "peak" | "setting" };
}

const DASHA_YEARS: Record<PlanetId, number> = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 };
const YEAR_MS = 365.2425 * 24 * 3600 * 1000;
const COMBUST_ORB: Partial<Record<PlanetId, number>> = { moon: 12, mars: 17, mercury: 14, jupiter: 11, venus: 10, saturn: 15 };

export function birthToUtc(input: Pick<BirthInput, "birthDate" | "birthTime" | "timezone">) {
  const local = DateTime.fromISO(`${input.birthDate}T${input.birthTime}`, { zone: input.timezone });
  if (!local.isValid) throw new Error(`Invalid birth date/time/timezone: ${local.invalidExplanation ?? ""}`);
  return { date: local.toUTC().toJSDate(), offset: local.offset };
}

export function vimshottari(moonLon: number, birth: Date): DashaPeriod[] {
  const nak = nakshatraOf(moonLon);
  const startIdx = nak.index % 9;
  const periods: DashaPeriod[] = [];
  // Dasha running at birth began before birth by the elapsed portion.
  let cursor = birth.getTime() - nak.fraction * DASHA_YEARS[NAKSHATRA_LORDS[startIdx]] * YEAR_MS;
  for (let i = 0; i < 9; i++) {
    const lord = NAKSHATRA_LORDS[(startIdx + i) % 9];
    const len = DASHA_YEARS[lord] * YEAR_MS;
    const md: DashaPeriod = { lord, start: new Date(cursor).toISOString(), end: new Date(cursor + len).toISOString(), antardashas: [] };
    let sub = cursor;
    for (let j = 0; j < 9; j++) {
      const al = NAKSHATRA_LORDS[(startIdx + i + j) % 9];
      const alen = (len * DASHA_YEARS[al]) / 120;
      md.antardashas!.push({ lord: al, start: new Date(sub).toISOString(), end: new Date(sub + alen).toISOString() });
      sub += alen;
    }
    periods.push(md);
    cursor += len;
  }
  return periods;
}

function currentDasha(dashas: DashaPeriod[], now: Date) {
  const t = now.toISOString();
  const md = dashas.find((d) => d.start <= t && t < d.end);
  if (!md) return null;
  const ad = md.antardashas!.find((d) => d.start <= t && t < d.end)!;
  return { mahadasha: md.lord, antardasha: ad.lord, mahaEnd: md.end, antarEnd: ad.end };
}

const houseFrom = (fromSign: number, sign: number) => ((sign - fromSign + 12) % 12) + 1;
const KENDRA = [1, 4, 7, 10];

function detectYogas(p: Record<PlanetId, PlanetPlacement>, lagnaSign: number): string[] {
  const yogas: string[] = [];
  const moon = p.moon;
  if (KENDRA.includes(houseFrom(moon.sign, p.jupiter.sign))) yogas.push("gajakesari");
  if (p.sun.sign === p.mercury.sign && !p.mercury.combust) yogas.push("budhaditya");
  if (p.moon.sign === p.mars.sign) yogas.push("chandraMangala");
  const mahapurusha: [PlanetId, string][] = [["mars", "ruchaka"], ["mercury", "bhadra"], ["jupiter", "hamsa"], ["venus", "malavya"], ["saturn", "sasa"]];
  for (const [pl, name] of mahapurusha) {
    const d = p[pl].dignity;
    if ((d === "own" || d === "exalted") && KENDRA.includes(p[pl].house)) yogas.push(name);
  }
  const lagnaLord = p[SIGN_LORD[lagnaSign]];
  if (lagnaLord.dignity === "exalted" || lagnaLord.dignity === "own") yogas.push("strongLagnaLord");
  // Raja yoga: lord of a kendra conjunct lord of a trikona (different planets).
  const kendraLords = new Set([1, 4, 7, 10].map((h) => SIGN_LORD[(lagnaSign + h - 1) % 12]));
  const trikonaLords = new Set([5, 9].map((h) => SIGN_LORD[(lagnaSign + h - 1) % 12]));
  outer: for (const k of kendraLords) for (const t of trikonaLords) {
    if (k !== t && p[k].sign === p[t].sign) { yogas.push("rajaYoga"); break outer; }
  }
  // Dhana yoga: 2nd and 11th lords together, or 2nd lord in 11th.
  const l2 = SIGN_LORD[(lagnaSign + 1) % 12], l11 = SIGN_LORD[(lagnaSign + 10) % 12];
  if (l2 !== l11 && (p[l2].sign === p[l11].sign || p[l2].house === 11)) yogas.push("dhanaYoga");
  // Kemadruma: no planet (except Sun/Rahu/Ketu) in 2nd or 12th from Moon, and none with Moon.
  const around = (["mars", "mercury", "jupiter", "venus", "saturn"] as PlanetId[]).some((id) => {
    const h = houseFrom(moon.sign, p[id].sign);
    return h === 2 || h === 12 || h === 1;
  });
  if (!around) yogas.push("kemadruma");
  // Vipreet raja yoga: lord of 6/8/12 placed in 6/8/12.
  const dusthana = [6, 8, 12];
  if (dusthana.some((h) => { const l = SIGN_LORD[(lagnaSign + h - 1) % 12]; return dusthana.includes(p[l].house) && h !== p[l].house; })) yogas.push("vipreetRaja");
  return yogas;
}

function detectDoshas(p: Record<PlanetId, PlanetPlacement>, now: Date) {
  const marsHouse = p.mars.house;
  const marsFromMoon = houseFrom(p.moon.sign, p.mars.sign);
  const manglik = [1, 2, 4, 7, 8, 12].includes(marsHouse) || [1, 2, 4, 7, 8, 12].includes(marsFromMoon);
  // Classical cancellations: Mars in own/exalted sign, or Jupiter aspecting/with Mars.
  const jupFromMars = houseFrom(p.mars.sign, p.jupiter.sign);
  const manglikCancelled = manglik && (["own", "exalted"].includes(p.mars.dignity) || [1, 5, 7, 9].includes(houseFrom(p.jupiter.sign, p.mars.sign)) || jupFromMars === 1);
  // Kaal sarp: all seven planets on one side of the Rahu–Ketu axis.
  const rahu = p.rahu.longitude;
  const sides = (["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as PlanetId[]).map((id) => norm360(p[id].longitude - rahu) < 180);
  const kaalSarp = sides.every(Boolean) || sides.every((s) => !s);
  // Sade sati: transit Saturn in 12th, 1st or 2nd from natal Moon.
  const saturnNow = planetPositions(now).find((x) => x.id === "saturn")!;
  const h = houseFrom(p.moon.sign, Math.floor(saturnNow.sidereal / 30));
  const sadeSati = h === 12 ? "rising" : h === 1 ? "peak" : h === 2 ? "setting" : "none";
  return { manglik, manglikCancelled, kaalSarp, sadeSati } as Kundali["doshas"];
}

export function buildKundali(input: BirthInput, now = new Date()): Kundali {
  const { date, offset } = birthToUtc(input);
  const raw = planetPositions(date);
  const { ascendant, ayanamsa } = siderealAscendant(date, input.latitude, input.longitude);
  const lagnaSign = Math.floor(ascendant / 30);
  const sunLon = raw.find((r) => r.id === "sun")!.sidereal;

  const planets: PlanetPlacement[] = raw.map((r) => {
    const sign = Math.floor(r.sidereal / 30);
    const nak = nakshatraOf(r.sidereal);
    const orb = COMBUST_ORB[r.id];
    let sep = Math.abs(r.sidereal - sunLon);
    if (sep > 180) sep = 360 - sep;
    return {
      id: r.id,
      longitude: r.sidereal,
      sign,
      degreeInSign: r.sidereal - sign * 30,
      house: houseFrom(lagnaSign, sign),
      nakshatra: nak.index,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      retrograde: r.retrograde,
      combust: orb !== undefined && sep < orb,
      dignity: dignity(r.id, sign),
      navamsaSign: navamsaSign(r.sidereal),
    };
  });
  const byId = Object.fromEntries(planets.map((pl) => [pl.id, pl])) as Record<PlanetId, PlanetPlacement>;

  const houses = Array.from({ length: 12 }, (_, i) => {
    const sign = (lagnaSign + i) % 12;
    return { house: i + 1, sign, lord: SIGN_LORD[sign], occupants: planets.filter((pl) => pl.sign === sign).map((pl) => pl.id) };
  });

  const moonLon = byId.moon.longitude;
  const elong = norm360(moonLon - sunLon);
  const tithi = Math.floor(elong / 12); // 0..29
  const karanaIdx = Math.floor(elong / 6); // 0..59
  const localWeekday = DateTime.fromJSDate(date, { zone: input.timezone }).weekday % 7; // 0 = Sunday
  const panchang = {
    tithi: (tithi % 15) + 1,
    paksha: (tithi < 15 ? "shukla" : "krishna") as "shukla" | "krishna",
    vara: localWeekday,
    yoga: Math.floor(norm360(moonLon + sunLon) / NAK_SPAN),
    karana: karanaIdx === 0 ? 10 : karanaIdx >= 57 ? 7 + (karanaIdx - 57) : (karanaIdx - 1) % 7, // 0-6 movable, 7-10 fixed
    nakshatra: byId.moon.nakshatra,
  };

  const ascNak = nakshatraOf(ascendant);
  const dashas = vimshottari(moonLon, date);

  return {
    input,
    utc: date.toISOString(),
    utcOffsetMinutes: offset,
    ayanamsa,
    ascendant: { longitude: ascendant, sign: lagnaSign, degreeInSign: ascendant - lagnaSign * 30, nakshatra: ascNak.index, pada: ascNak.pada, navamsaSign: navamsaSign(ascendant) },
    planets,
    houses,
    panchang,
    moonSign: byId.moon.sign,
    sunSign: byId.sun.sign,
    dashas,
    currentDasha: currentDasha(dashas, now),
    yogas: detectYogas(byId, lagnaSign),
    doshas: detectDoshas(byId, now),
  };
}

export { PLANETS };
