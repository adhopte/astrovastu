import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";
import type { AstroContent, Lang } from "./types";

export const ASTRO_CONTENT: Record<Lang, AstroContent> = { en, hi, mr };
export * from "./types";
