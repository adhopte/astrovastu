import type { Lang } from "../../astro/content/types.js";
import { en } from "./en.js";
import { hi } from "./hi.js";
import { mr } from "./mr.js";
import type { VastuContent } from "./types.js";

export const VASTU_CONTENT: Record<Lang, VastuContent> = { en, hi, mr };
export type { VastuContent };
