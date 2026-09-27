import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { requireAuth } from "../auth/jwt.js";
import { CITIES, Place } from "../geo/cities.js";

export const geoRouter = Router();
geoRouter.use(requireAuth);

async function remoteSearch(q: string, lang: string): Promise<Place[]> {
  const url = `${config.geocodeUrl}?name=${encodeURIComponent(q)}&count=10&language=${lang}&format=json`;
  const ctrl = AbortSignal.timeout(4000);
  const r = await fetch(url, { signal: ctrl });
  if (!r.ok) return [];
  const data = (await r.json()) as { results?: { name: string; admin1?: string; country?: string; latitude: number; longitude: number; timezone?: string }[] };
  return (data.results ?? [])
    .filter((x) => x.timezone)
    .map((x) => ({ name: x.name, admin1: x.admin1, country: x.country ?? "", latitude: x.latitude, longitude: x.longitude, timezone: x.timezone! }));
}

/** Birth-place search. Local gazetteer first (instant, offline), then the geocoding API. */
geoRouter.get("/search", async (req, res) => {
  const { q, lang } = z.object({ q: z.string().trim().min(2).max(80), lang: z.enum(["en", "hi", "mr"]).default("en") }).parse(req.query);
  const needle = q.toLowerCase();
  const local = CITIES.filter((c) => c.name.toLowerCase().includes(needle) || c.admin1?.toLowerCase().startsWith(needle)).slice(0, 8);
  let remote: Place[] = [];
  try {
    remote = await remoteSearch(q, lang);
  } catch {
    // Offline or blocked: local results are still useful.
  }
  const seen = new Set<string>();
  const merged = [...local, ...remote].filter((p) => {
    const key = `${p.latitude.toFixed(1)},${p.longitude.toFixed(1)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  res.json({ items: merged.slice(0, 12) });
});
