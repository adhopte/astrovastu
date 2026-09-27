import { en } from "./en.js";
import { hi } from "./hi.js";
import { mr } from "./mr.js";
import type { AstroContent, Lang } from "./types.js";

export const ASTRO_CONTENT: Record<Lang, AstroContent> = { en, hi, mr };
export * from "./types.js";
