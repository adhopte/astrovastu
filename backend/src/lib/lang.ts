import type { Request } from "express";
import { LANGS, Lang } from "../astro/content/types.js";
import { getUser } from "../auth/users.js";
import { userIdOf } from "../auth/jwt.js";

export function langOf(req: Request): Lang {
  const q = (req.query.lang ?? req.body?.lang) as string | undefined;
  if (q && (LANGS as string[]).includes(q)) return q as Lang;
  const u = getUser(userIdOf(req));
  return u && (LANGS as string[]).includes(u.language) ? (u.language as Lang) : "en";
}
