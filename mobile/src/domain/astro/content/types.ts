import type { PlanetId } from "../ephemeris";
import type { Dignity } from "../kundali";

export type Lang = "en" | "hi" | "mr";
export const LANGS: Lang[] = ["en", "hi", "mr"];

export interface PlanetRemedy {
  gem: string;
  mantra: string;
  day: string;
  color: string;
  charity: string;
}

export interface AstroContent {
  signs: string[];
  planets: Record<PlanetId, string>;
  nakshatras: string[];
  tithis: string[]; // 15 names; index 14 is Purnima (shukla) / Amavasya handled via extra keys
  purnima: string;
  amavasya: string;
  paksha: { shukla: string; krishna: string };
  varas: string[]; // Sunday first
  yogaNames: string[]; // 27 nitya yogas
  karanas: string[]; // 11
  houseOrdinal: (n: number) => string; // "7th house" / "सप्तम भाव"
  houseTopics: string[]; // 12
  lagnaTraits: string[]; // 12
  moonTraits: string[]; // 12
  planetNature: Record<PlanetId, string>;
  dignity: Record<Dignity, string>;
  retrograde: string;
  combust: string;
  sections: Record<
    "personality" | "mind" | "career" | "wealth" | "relationships" | "health" | "education" | "spirituality" | "dasha" | "yogas" | "doshas" | "remedies",
    string
  >;
  t: {
    lagnaIntro: (sign: string) => string;
    lordPlaced: (house: string, sign: string, lord: string, lordHouse: string, lordTopic: string, dignity: string) => string;
    occupant: (planet: string, nature: string, extra: string) => string;
    emptyHouse: (house: string) => string;
    moonIntro: (sign: string) => string;
    nakshatra: (nak: string, pada: number, lord: string) => string;
    currentDasha: (md: string, ad: string, mdEnd: string, adEnd: string) => string;
    nextDasha: (lord: string, start: string) => string;
    noYogas: string;
    weakPlanet: (planet: string, reason: string) => string;
    lagnaGem: (lord: string, gem: string) => string;
    lucky: (color: string, day: string, num: number) => string;
    venusNote: (house: string, dignity: string) => string;
    disclaimer: string;
  };
  dashaThemes: Record<PlanetId, string>;
  yogas: Record<string, { name: string; desc: string }>;
  doshas: {
    manglik: string;
    manglikCancelled: string;
    kaalSarp: string;
    sadeSati: Record<"rising" | "peak" | "setting", string>;
    none: string;
  };
  remedies: Record<PlanetId, PlanetRemedy>;
  weakReasons: { debilitated: string; enemy: string; combust: string };
}
