import type { PlanetId } from "./ephemeris";
import { Kundali, PlanetPlacement, SIGN_LORD } from "./kundali";
import { ASTRO_CONTENT, AstroContent, Lang } from "./content/index";

const BENEFICS: PlanetId[] = ["jupiter", "venus", "mercury", "moon"];
const UPACHAYA = [3, 6, 10, 11];
const DUSTHANA = [6, 8, 12];
const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
/** Chaldean/Vedic numerology number for each planet. */
const PLANET_NUMBER: Record<PlanetId, number> = { sun: 1, moon: 2, jupiter: 3, rahu: 4, mercury: 5, venus: 6, ketu: 7, saturn: 8, mars: 9 };

export type SectionKey = keyof AstroContent["sections"];

export interface ReportSection {
  key: SectionKey;
  title: string;
  rating?: number; // 1..5
  paragraphs: string[];
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
  dashas: { lord: PlanetId; name: string; start: string; end: string; current: boolean; antardashas: { lord: PlanetId; name: string; start: string; end: string; current: boolean }[] }[];
  disclaimer: string;
}

export function formatDate(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

function houseRating(k: Kundali, byId: Record<PlanetId, PlanetPlacement>, house: number): number {
  const h = k.houses[house - 1];
  const lord = byId[h.lord];
  let s = 3;
  s += { exalted: 1.5, own: 1, friendly: 0.5, neutral: 0, enemy: -0.5, debilitated: -1.5 }[lord.dignity];
  if (DUSTHANA.includes(lord.house) && !DUSTHANA.includes(house)) s -= 0.5;
  if ([1, 4, 5, 7, 9, 10].includes(lord.house)) s += 0.5;
  if (lord.combust) s -= 0.5;
  for (const occ of h.occupants) {
    if (BENEFICS.includes(occ)) s += byId[occ].dignity === "debilitated" ? 0 : 0.5;
    else s += UPACHAYA.includes(house) ? 0.3 : -0.4;
  }
  return Math.max(1, Math.min(5, Math.round(s * 2) / 2));
}

function houseParagraphs(k: Kundali, byId: Record<PlanetId, PlanetPlacement>, c: AstroContent, house: number): string[] {
  const h = k.houses[house - 1];
  const lord = byId[h.lord];
  const out = [
    c.t.lordPlaced(c.houseOrdinal(house), c.signs[h.sign], c.planets[h.lord], c.houseOrdinal(lord.house), c.houseTopics[lord.house - 1], c.dignity[lord.dignity]),
  ];
  if (h.occupants.length === 0) out.push(c.t.emptyHouse(c.houseOrdinal(house)));
  for (const occ of h.occupants) {
    const pl = byId[occ];
    const extra = (pl.retrograde && occ !== "rahu" && occ !== "ketu" ? c.retrograde : "") + (pl.combust ? c.combust : "");
    out.push(c.t.occupant(c.planets[occ], c.planetNature[occ], extra));
  }
  return out;
}

export function buildReport(k: Kundali, lang: Lang, now = new Date()): KundaliReport {
  const c = ASTRO_CONTENT[lang];
  const byId = Object.fromEntries(k.planets.map((p) => [p.id, p])) as Record<PlanetId, PlanetPlacement>;
  const moon = byId.moon;
  const lagnaLord = SIGN_LORD[k.ascendant.sign];

  const combined = (houses: number[], extra: string[] = []): { rating: number; paragraphs: string[] } => ({
    rating: Math.round((houses.reduce((a, h) => a + houseRating(k, byId, h), 0) / houses.length) * 2) / 2,
    paragraphs: [...houses.flatMap((h) => houseParagraphs(k, byId, c, h)), ...extra],
  });

  const personality = combined([1]);
  personality.paragraphs.unshift(c.t.lagnaIntro(c.signs[k.ascendant.sign]), c.lagnaTraits[k.ascendant.sign]);

  const mind: ReportSection = {
    key: "mind",
    title: c.sections.mind,
    rating: houseRating(k, byId, 4),
    paragraphs: [c.t.moonIntro(c.signs[moon.sign]), c.moonTraits[moon.sign], c.t.nakshatra(c.nakshatras[moon.nakshatra], moon.pada, c.planets[moon.nakshatraLord])],
  };

  const relationships = combined([7], [c.t.venusNote(c.houseOrdinal(byId.venus.house), c.dignity[byId.venus.dignity])]);
  if (k.doshas.manglik) relationships.paragraphs.push(k.doshas.manglikCancelled ? c.doshas.manglikCancelled : c.doshas.manglik);

  const sections: ReportSection[] = [
    { key: "personality", title: c.sections.personality, ...personality },
    mind,
    { key: "career", title: c.sections.career, ...combined([10]) },
    { key: "wealth", title: c.sections.wealth, ...combined([2, 11]) },
    { key: "relationships", title: c.sections.relationships, ...relationships },
    { key: "health", title: c.sections.health, ...combined([6]) },
    { key: "education", title: c.sections.education, ...combined([5]) },
    { key: "spirituality", title: c.sections.spirituality, ...combined([9, 12]) },
  ];

  // Dasha forecast.
  const dashaParas: string[] = [];
  const cd = k.currentDasha;
  if (cd) {
    dashaParas.push(c.t.currentDasha(c.planets[cd.mahadasha], c.planets[cd.antardasha], formatDate(cd.mahaEnd, lang), formatDate(cd.antarEnd, lang)));
    dashaParas.push(`${c.planets[cd.mahadasha]}: ${c.dashaThemes[cd.mahadasha]}`);
    if (cd.antardasha !== cd.mahadasha) dashaParas.push(`${c.planets[cd.antardasha]}: ${c.dashaThemes[cd.antardasha]}`);
    const idx = k.dashas.findIndex((d) => d.lord === cd.mahadasha && d.end === cd.mahaEnd);
    const next = k.dashas[idx + 1];
    if (next) dashaParas.push(c.t.nextDasha(c.planets[next.lord], formatDate(next.start, lang)));
  }
  sections.push({ key: "dasha", title: c.sections.dasha, paragraphs: dashaParas });

  const yogas = k.yogas.map((key) => ({ key, ...c.yogas[key] }));

  const doshas: KundaliReport["doshas"] = [];
  if (k.doshas.manglik) doshas.push({ key: "manglik", text: k.doshas.manglikCancelled ? c.doshas.manglikCancelled : c.doshas.manglik, active: !k.doshas.manglikCancelled });
  if (k.doshas.kaalSarp) doshas.push({ key: "kaalSarp", text: c.doshas.kaalSarp, active: true });
  if (k.doshas.sadeSati !== "none") doshas.push({ key: "sadeSati", text: c.doshas.sadeSati[k.doshas.sadeSati], active: true });
  if (doshas.length === 0) doshas.push({ key: "none", text: c.doshas.none, active: false });

  // Remedies: lagna lord first, then weak planets.
  const remedies: KundaliReport["remedies"] = [{ planet: lagnaLord, name: c.planets[lagnaLord], ...c.remedies[lagnaLord] }];
  for (const p of k.planets) {
    const reason = p.dignity === "debilitated" ? c.weakReasons.debilitated : p.combust ? c.weakReasons.combust : p.dignity === "enemy" && ["sun", "moon", "jupiter", "venus", "mercury"].includes(p.id) ? c.weakReasons.enemy : undefined;
    if (reason && p.id !== lagnaLord) remedies.push({ planet: p.id, name: c.planets[p.id], ...c.remedies[p.id], reason: c.t.weakPlanet(c.planets[p.id], reason) });
  }
  const lr = c.remedies[lagnaLord];
  sections.push({
    key: "remedies",
    title: c.sections.remedies,
    paragraphs: [c.t.lagnaGem(c.planets[lagnaLord], lr.gem), c.t.lucky(lr.color, lr.day, PLANET_NUMBER[lagnaLord]), ...remedies.filter((r) => r.reason).map((r) => r.reason!)],
  });

  const t = now.toISOString();
  const tithiName = k.panchang.tithi === 15 ? (k.panchang.paksha === "shukla" ? c.purnima : c.amavasya) : c.tithis[k.panchang.tithi - 1];

  return {
    lang,
    labels: { signs: c.signs, planets: c.planets, nakshatras: c.nakshatras, houseTopics: c.houseTopics },
    summary: {
      lagna: c.signs[k.ascendant.sign],
      moonSign: c.signs[k.moonSign],
      sunSign: c.signs[k.sunSign],
      nakshatra: c.nakshatras[moon.nakshatra],
      pada: moon.pada,
      nakshatraLord: c.planets[moon.nakshatraLord],
    },
    panchang: {
      tithi: tithiName,
      paksha: c.paksha[k.panchang.paksha],
      vara: c.varas[k.panchang.vara],
      yoga: c.yogaNames[k.panchang.yoga],
      karana: c.karanas[k.panchang.karana],
      nakshatra: c.nakshatras[k.panchang.nakshatra],
    },
    sections,
    yogas,
    doshas,
    remedies,
    dashas: k.dashas.map((d) => ({
      lord: d.lord,
      name: c.planets[d.lord],
      start: d.start,
      end: d.end,
      current: d.start <= t && t < d.end,
      antardashas: (d.antardashas ?? []).map((a) => ({ lord: a.lord, name: c.planets[a.lord], start: a.start, end: a.end, current: a.start <= t && t < a.end })),
    })),
    disclaimer: c.t.disclaimer,
  };
}
