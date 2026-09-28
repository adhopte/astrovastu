import type { Lang } from "../../astro/content/types";
import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";
import type { VastuContent } from "./types";

export const VASTU_CONTENT: Record<Lang, VastuContent> = { en, hi, mr };
export type { VastuContent };
