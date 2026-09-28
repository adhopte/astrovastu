import type { Lang } from "./types";

const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

export function fmtDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  try {
    return new Intl.DateTimeFormat(LOCALE[lang], opts).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export const fmtDateTime = (iso: string, lang: Lang) =>
  fmtDate(iso, lang, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/** 12.5 → 12°30′ */
export function fmtDegree(deg: number) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′`;
}

/** "YYYY-MM-DD" + "HH:mm" formatted for display without timezone shifts. */
export function fmtBirth(date: string, time: string, lang: Lang) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
  return {
    date: fmtDate(dt.toISOString(), lang, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    time: fmtDate(dt.toISOString(), lang, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
  };
}
