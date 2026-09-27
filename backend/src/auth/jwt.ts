import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { HttpError } from "../lib/http.js";
import { getDb } from "../db/index.js";

export interface AuthedRequest extends Request {
  userId?: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Missing token", "unauthorized"));
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    const exists = getDb().prepare("SELECT 1 FROM users WHERE id = ?").get(payload.sub as string);
    if (!exists) return next(new HttpError(401, "User no longer exists", "unauthorized"));
    req.userId = payload.sub as string;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token", "unauthorized"));
  }
}

export const userIdOf = (req: Request) => (req as AuthedRequest).userId!;
