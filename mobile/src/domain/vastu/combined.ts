import type { PlanetId } from "../astro/ephemeris";
import { Kundali, SIGN_LORD, signElement } from "../astro/kundali";
import { ASTRO_CONTENT, Lang } from "../astro/content/index";
import { VASTU_CONTENT } from "./content/index";
import { Zone } from "./grid";
import { VastuInput, computeVastu } from "./analysis";

/** Traditional dik (direction) lordship of the navagraha. */
export const PLANET_DIRECTION: Record<PlanetId, Zone> = {
  sun: "E", venus: "SE", mars: "S", rahu: "SW", saturn: "W", moon: "NW", mercury: "N", jupiter: "NE", ketu: "NW",
};
const ELEMENT_ZONES: Record<"fire" | "earth" | "air" | "water", Zone[]> = {
  fire: ["E", "SE", "S"], earth: ["SW", "S", "WSW"], air: ["NW", "W", "N"], water: ["N", "NE", "NNE"],
};

export interface CombinedReport {
  title: string;
  favourableZones: Zone[];
  paragraphs: string[];
  alerts: string[];
  supports: string[];
}

export function buildCombinedReport(k: Kundali, vastu: VastuInput | null, lang: Lang): CombinedReport {
  const a = ASTRO_CONTENT[lang];
  const v = VASTU_CONTENT[lang];
  const lagnaLord = SIGN_LORD[k.ascendant.sign];
  const lagnaDir = PLANET_DIRECTION[lagnaLord];
  const md = k.currentDasha?.mahadasha;
  const mdDir = md ? PLANET_DIRECTION[md] : undefined;
  const moonEl = signElement(k.moonSign);
  const elZones = ELEMENT_ZONES[moonEl];

  const paragraphs = [v.combined.lagnaLordDir(a.planets[lagnaLord], v.zoneNames[lagnaDir])];
  if (md && mdDir) paragraphs.push(v.combined.dashaLordDir(a.planets[md], v.zoneNames[mdDir]));
  paragraphs.push(v.combined.elementDirs(v.combined.signElements[moonEl], elZones.map((z) => v.zoneNames[z]).join(", ")));
  // Head towards South is universally restful; East is preferred for fire/air lagnas (learning, vitality).
  const lagnaEl = signElement(k.ascendant.sign);
  paragraphs.push(v.combined.sleepHead(lagnaEl === "fire" || lagnaEl === "air" ? v.zoneNames.E : v.zoneNames.S));
  paragraphs.push(v.combined.workFacing(lagnaDir === "N" || lagnaDir === "NE" || lagnaDir === "E" ? v.zoneNames[lagnaDir] : v.zoneNames.N));
  paragraphs.push(v.combined.colorTip(v.zoneNames[lagnaDir], a.remedies[lagnaLord].color));

  const alerts: string[] = [];
  const supports: string[] = [];
  if (vastu) {
    const keyPlanets = new Map<Zone, PlanetId>();
    keyPlanets.set(lagnaDir, lagnaLord);
    if (md && mdDir && !keyPlanets.has(mdDir)) keyPlanets.set(mdDir, md);
    for (const r of computeVastu(vastu)) {
      if (r.zone === "C") continue;
      const lord = keyPlanets.get(r.zone);
      if (!lord) continue;
      const room = v.rooms[r.type];
      if (r.type === "toilet" || r.type === "store" || r.score < 0) alerts.push(v.combined.afflicted(room, v.zoneNames[r.zone], a.planets[lord]));
      else if (r.score > 0) supports.push(v.combined.supported(room, v.zoneNames[r.zone], a.planets[lord]));
    }
  }

  const favourableZones = Array.from(new Set([lagnaDir, ...(mdDir ? [mdDir] : []), ...elZones]));
  return { title: v.combined.title, favourableZones, paragraphs, alerts, supports };
}
