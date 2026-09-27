import { describe, expect, it } from "vitest";
import * as Astronomy from "astronomy-engine";
import { ascendantAndMc, lahiriAyanamsa, planetPositions } from "../src/astro/ephemeris.js";
import { buildKundali, navamsaSign, nakshatraOf, vimshottari } from "../src/astro/kundali.js";
import { buildReport } from "../src/astro/predictions.js";

const PUNE = { latitude: 18.5204, longitude: 73.8567 };

describe("ephemeris", () => {
  it("puts the ascendant on the Sun at sunrise", () => {
    const obs = new Astronomy.Observer(PUNE.latitude, PUNE.longitude, 0);
    const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, +1, new Date("2024-03-01T00:00:00Z"), 2)!;
    const { ascendant } = ascendantAndMc(rise.date, PUNE.latitude, PUNE.longitude);
    const sun = Astronomy.SunPosition(rise.date).elon;
    expect(Math.abs(ascendant - sun)).toBeLessThan(1.5); // refraction + solar semi-diameter
  });

  it("matches the Lahiri ayanamsa", () => {
    expect(lahiriAyanamsa(new Date("2000-01-01T12:00:00Z"))).toBeCloseTo(23.853, 2);
    expect(lahiriAyanamsa(new Date("2024-01-01T00:00:00Z"))).toBeCloseTo(24.19, 1);
  });

  it("places the Sun in sidereal Capricorn at Makar Sankranti 2024", () => {
    const sun = planetPositions(new Date("2024-01-15T06:00:00Z")).find((p) => p.id === "sun")!;
    expect(Math.floor(sun.sidereal / 30)).toBe(9);
  });

  it("keeps Rahu and Ketu opposite", () => {
    const pos = planetPositions(new Date("2010-06-01T00:00:00Z"));
    const rahu = pos.find((p) => p.id === "rahu")!.sidereal;
    const ketu = pos.find((p) => p.id === "ketu")!.sidereal;
    expect(Math.abs(((ketu - rahu + 360) % 360) - 180)).toBeLessThan(1e-9);
  });
});

describe("kundali", () => {
  const k = buildKundali({ name: "T", birthDate: "1990-08-15", birthTime: "06:30", placeName: "Pune", ...PUNE, timezone: "Asia/Kolkata" }, new Date("2026-09-27T00:00:00Z"));

  it("converts local birth time to UTC with the historical offset", () => {
    expect(k.utc).toBe("1990-08-15T01:00:00.000Z");
    expect(k.utcOffsetMinutes).toBe(330);
  });

  it("computes a Leo ascendant for a Pune sunrise in mid-August", () => {
    expect(k.ascendant.sign).toBe(4);
    expect(k.houses[0].sign).toBe(4);
    expect(k.planets.find((p) => p.id === "jupiter")!.dignity).toBe("exalted"); // Jupiter in Cancer, 1990
  });

  it("builds 9 mahadashas totalling 120 years with contiguous antardashas", () => {
    expect(k.dashas).toHaveLength(9);
    const span = (Date.parse(k.dashas[8].end) - Date.parse(k.dashas[0].start)) / (365.2425 * 86400_000);
    expect(span).toBeCloseTo(120, 5);
    for (const d of k.dashas) {
      expect(d.antardashas![0].start).toBe(d.start);
      expect(Math.abs(Date.parse(d.antardashas![8].end) - Date.parse(d.end))).toBeLessThan(5);
    }
    expect(k.currentDasha).not.toBeNull();
  });

  it("derives nakshatra, navamsa and dasha start correctly", () => {
    expect(nakshatraOf(0)).toMatchObject({ index: 0, pada: 1, lord: "ketu" });
    expect(nakshatraOf(359.9)).toMatchObject({ index: 26, pada: 4, lord: "mercury" });
    expect(navamsaSign(0)).toBe(0); // Aries 0° → Aries navamsa
    expect(navamsaSign(30)).toBe(9); // Taurus 0° → Capricorn navamsa
    expect(vimshottari(0, new Date("2000-01-01T00:00:00Z"))[0].lord).toBe("ketu");
  });

  it("rejects impossible local times", () => {
    expect(() => buildKundali({ name: "x", birthDate: "2023-02-30", birthTime: "10:00", placeName: "x", ...PUNE, timezone: "Asia/Kolkata" })).toThrow();
  });

  it("produces a complete report in all three languages", () => {
    for (const lang of ["en", "hi", "mr"] as const) {
      const r = buildReport(k, lang);
      expect(r.sections.map((s) => s.key)).toEqual(["personality", "mind", "career", "wealth", "relationships", "health", "education", "spirituality", "dasha", "remedies"]);
      for (const s of r.sections) {
        expect(s.paragraphs.length).toBeGreaterThan(0);
        for (const p of s.paragraphs) expect(p).not.toMatch(/undefined|NaN/);
      }
      expect(r.dashas.filter((d) => d.current)).toHaveLength(1);
    }
    expect(buildReport(k, "hi").summary.lagna).toBe("सिंह");
    expect(buildReport(k, "mr").summary.moonSign).toBe("वृषभ");
  });
});
