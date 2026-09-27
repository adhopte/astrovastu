import { describe, expect, it } from "vitest";
import { locate, zoneForBearing, ZONES } from "../src/vastu/grid.js";
import { buildVastuReport } from "../src/vastu/analysis.js";
import { buildCombinedReport } from "../src/vastu/combined.js";
import { buildKundali } from "../src/astro/kundali.js";

const grid = { center: { x: 0.5, y: 0.5 }, northAngle: 0, aspectRatio: 1 };

describe("16-zone grid", () => {
  it("maps bearings to the 16 zones with N centred on 0°", () => {
    expect(zoneForBearing(0)).toBe("N");
    expect(zoneForBearing(350)).toBe("N");
    expect(zoneForBearing(11.3)).toBe("NNE");
    expect(zoneForBearing(45)).toBe("NE");
    expect(zoneForBearing(180)).toBe("S");
    expect(zoneForBearing(225)).toBe("SW");
    ZONES.forEach((z, i) => expect(zoneForBearing(i * 22.5)).toBe(z));
  });

  it("locates points relative to the marked north", () => {
    expect(locate({ x: 0.5, y: 0.05 }, grid).zone).toBe("N");
    expect(locate({ x: 0.95, y: 0.95 }, grid).zone).toBe("SE");
    expect(locate({ x: 0.5, y: 0.5 }, grid).zone).toBe("C");
    // North arrow pointing to the image's right: the top of the image is West.
    expect(locate({ x: 0.5, y: 0.05 }, { ...grid, northAngle: 90 }).zone).toBe("W");
    expect(locate({ x: 0.95, y: 0.5 }, { ...grid, northAngle: 90 }).zone).toBe("N");
  });

  it("accounts for non-square plans", () => {
    // Wide plan (2:1): the top-right corner is atan(2) ≈ 63° east of north, i.e. ENE.
    const p = locate({ x: 1, y: 0 }, { ...grid, aspectRatio: 2 });
    expect(p.bearing).toBeCloseTo(63.43, 1);
    expect(p.zone).toBe("ENE");
  });
});

describe("vastu analysis", () => {
  const ideal = { grid, rooms: [
    { type: "kitchen" as const, x: 0.85, y: 0.85 },
    { type: "masterBedroom" as const, x: 0.15, y: 0.85 },
    { type: "living" as const, x: 0.5, y: 0.1 },
    { type: "pooja" as const, x: 0.85, y: 0.15 },
    { type: "toilet" as const, x: 0.3, y: 0.95 },
  ] };

  it("scores an ideal layout highly and a dosha-heavy layout poorly", () => {
    const good = buildVastuReport(ideal, "en");
    expect(good.score).toBeGreaterThanOrEqual(80);
    const bad = buildVastuReport({ grid, rooms: [
      { type: "toilet", x: 0.85, y: 0.15 }, // NE
      { type: "kitchen", x: 0.15, y: 0.15 }, // NW: acceptable
      { type: "kitchen", x: 0.5, y: 0.08 }, // N
      { type: "masterBedroom", x: 0.85, y: 0.15 }, // NE
    ] }, "en");
    expect(bad.score).toBeLessThan(45);
    expect(bad.findings[0].rating).toBe("bad");
    expect(bad.findings[0].remedies.length).toBeGreaterThan(0);
    expect(bad.zones.find((z) => z.zone === "NE")!.status).toBe("afflicted");
  });

  it("reports missing essentials and localises", () => {
    const r = buildVastuReport({ grid, rooms: [{ type: "kitchen", x: 0.85, y: 0.85 }] }, "mr");
    expect(r.findings[0].name).toBe("स्वयंपाकघर");
    expect(r.missing.length).toBe(4);
    expect(r.sectors).toHaveLength(16);
  });

  it("personalises vastu advice from a kundali", () => {
    const k = buildKundali({ name: "T", birthDate: "1990-08-15", birthTime: "06:30", placeName: "Pune", latitude: 18.52, longitude: 73.86, timezone: "Asia/Kolkata" });
    // Leo lagna → Sun → East. A toilet in the East should raise an alert.
    const c = buildCombinedReport(k, { grid, rooms: [{ type: "toilet", x: 0.95, y: 0.5 }] }, "en");
    expect(c.favourableZones[0]).toBe("E");
    expect(c.alerts.length).toBe(1);
    expect(c.paragraphs.length).toBeGreaterThanOrEqual(5);
  });
});
