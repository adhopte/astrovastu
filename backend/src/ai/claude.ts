import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { config } from "../config.js";
import type { Kundali } from "../astro/kundali.js";
import type { KundaliReport } from "../astro/predictions.js";
import type { Lang } from "../astro/content/types.js";
import { ROOM_TYPES } from "../vastu/rules.js";
import { HttpError } from "../lib/http.js";

/**
 * Optional Claude integration. The app is fully functional without it: kundali
 * predictions and vastu analysis come from the deterministic engines. When an
 * API key is configured, Claude adds (1) a narrative reading grounded in the
 * computed chart and (2) automatic room detection on uploaded floor plans.
 */
let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export const aiAvailable = () => config.ai.enabled;

const LANG_NAME: Record<Lang, string> = { en: "English", hi: "Hindi (Devanagari script)", mr: "Marathi (Devanagari script)" };

// Server-side fallback keeps requests working if the primary model declines.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

function assertUsable(stopReason: string | null) {
  if (stopReason === "refusal") throw new HttpError(422, "The AI declined this request", "ai_refused");
  if (stopReason === "max_tokens") throw new HttpError(502, "The AI response was cut short; please retry", "ai_truncated");
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  if (!aiAvailable()) throw new HttpError(503, "AI features are not configured on this server", "ai_disabled");
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new HttpError(429, "AI is busy, please try again shortly", "ai_rate_limited");
    if (e instanceof Anthropic.APIError) throw new HttpError(502, `AI service error (${e.status ?? "network"})`, "ai_error");
    throw e;
  }
}

const ReadingSchema = z.object({
  overview: z.string(),
  highlights: z.array(z.object({ title: z.string(), text: z.string() })),
  yearAhead: z.string(),
  guidance: z.array(z.string()),
});
export type AiReading = z.infer<typeof ReadingSchema>;

export async function aiKundaliReading(chart: Kundali, report: KundaliReport, lang: Lang): Promise<AiReading> {
  const facts = {
    lagna: report.summary.lagna,
    moonSign: report.summary.moonSign,
    sunSign: report.summary.sunSign,
    nakshatra: `${report.summary.nakshatra} pada ${report.summary.pada}`,
    planets: chart.planets.map((p) => ({ planet: report.labels.planets[p.id], sign: report.labels.signs[p.sign], house: p.house, dignity: p.dignity, retrograde: p.retrograde, combust: p.combust })),
    currentDasha: chart.currentDasha,
    yogas: report.yogas.map((y) => y.name),
    doshas: report.doshas.filter((d) => d.active).map((d) => d.key),
    today: new Date().toISOString().slice(0, 10),
  };
  return call(async () => {
    const res = await getClient().beta.messages.parse({
      model: config.ai.model,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: betaZodOutputFormat(ReadingSchema) },
      ...FALLBACK,
      system:
        "You are a warm, experienced Vedic (Jyotish) astrologer. Interpret only the chart facts provided — never invent placements. " +
        "Be encouraging and practical, avoid fatalistic or fear-inducing language, and never give medical, legal or financial directives. " +
        `Write every field in ${LANG_NAME[lang]}.`,
      messages: [
        {
          role: "user",
          content: `Sidereal (Lahiri) whole-sign chart facts:\n${JSON.stringify(facts, null, 2)}\n\nWrite: an overview paragraph; 4-6 highlights (career, relationships, wealth, health, spirituality as relevant); a paragraph on the next 12 months based on the running dasha; and 3-5 short, practical dharmic guidance points.`,
        },
      ],
    });
    assertUsable(res.stop_reason);
    if (!res.parsed_output) throw new HttpError(502, "AI returned an unreadable response", "ai_error");
    return res.parsed_output;
  });
}

const DetectSchema = z.object({
  northAngle: z.number().nullable(),
  rooms: z.array(z.object({ type: z.enum(ROOM_TYPES), label: z.string(), x: z.number(), y: z.number() })),
  notes: z.string(),
});
export type AiDetection = z.infer<typeof DetectSchema>;

export async function aiDetectRooms(image: Buffer, mediaType: "image/jpeg" | "image/png" | "image/webp"): Promise<AiDetection> {
  return call(async () => {
    const res = await getClient().beta.messages.parse({
      model: config.ai.model,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: betaZodOutputFormat(DetectSchema) },
      ...FALLBACK,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: image.toString("base64") } },
            {
              type: "text",
              text:
                "This is an architectural floor plan. Identify each room and return the centre of each room as normalised image coordinates " +
                "(x from 0 at the left edge to 1 at the right edge, y from 0 at the top edge to 1 at the bottom edge). " +
                `Map every room to one of these types: ${ROOM_TYPES.join(", ")}. Use 'bedroom' for any bedroom except the largest, which is 'masterBedroom'; ` +
                "bathrooms, WCs and washrooms are 'toilet'; the main door is 'entrance'. Put the original room label from the plan in 'label'. " +
                "If the plan has a north arrow, set northAngle to the clockwise angle in degrees from the image's up direction to the arrow; otherwise null. " +
                "Use 'notes' for anything the user should double-check.",
            },
          ],
        },
      ],
    });
    assertUsable(res.stop_reason);
    if (!res.parsed_output) throw new HttpError(502, "AI returned an unreadable response", "ai_error");
    const out = res.parsed_output;
    out.rooms = out.rooms.map((r) => ({ ...r, x: Math.min(1, Math.max(0, r.x)), y: Math.min(1, Math.max(0, r.y)) }));
    return out;
  });
}
