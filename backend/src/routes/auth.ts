import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../config.js";
import { signToken, requireAuth, userIdOf } from "../auth/jwt.js";
import { verifyApple, verifyFacebook, verifyGoogle, VerifiedProfile } from "../auth/providers.js";
import { createUser, findOrCreateFromProfile, getUserByEmail, linkIdentity, publicUser, touchLogin, UserRow } from "../auth/users.js";
import { HttpError } from "../lib/http.js";
import { logActivity } from "../lib/activity.js";
import type { Request, Response } from "express";

export const authRouter = Router();

const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", 12);

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: "draft-8", legacyHeaders: false });
authRouter.use(limiter);

const lang = z.enum(["en", "hi", "mr"]).optional();

function respond(req: Request, res: Response, user: UserRow, created: boolean, method: string) {
  logActivity(req, user.id, created ? "auth.signup" : "auth.login", undefined, { method });
  res.status(created ? 201 : 200).json({ token: signToken(user.id), user: publicUser(user), created });
}

async function social(req: Request, res: Response, profile: Promise<VerifiedProfile>, language?: string) {
  const p = await profile;
  const { user, created } = findOrCreateFromProfile(p, language);
  respond(req, res, user, created, p.provider);
}

authRouter.get("/providers", (_req, res) => {
  res.json({
    google: config.google.clientIds.length > 0,
    facebook: Boolean(config.facebook.appId && config.facebook.appSecret),
    apple: config.apple.audiences.length > 0,
    email: true,
    demo: config.devLogin,
  });
});

authRouter.post("/google", async (req, res) => {
  const body = z.object({ idToken: z.string().min(10), language: lang }).parse(req.body);
  await social(req, res, verifyGoogle(body.idToken), body.language);
});

authRouter.post("/facebook", async (req, res) => {
  const body = z.object({ accessToken: z.string().min(10), language: lang }).parse(req.body);
  await social(req, res, verifyFacebook(body.accessToken), body.language);
});

authRouter.post("/apple", async (req, res) => {
  const body = z.object({ identityToken: z.string().min(10), fullName: z.string().max(120).optional(), language: lang }).parse(req.body);
  await social(req, res, verifyApple(body.identityToken, body.fullName), body.language);
});

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

authRouter.post("/register", async (req, res) => {
  const body = z.object({ email: emailSchema, password: z.string().min(8).max(128), name: z.string().trim().min(1).max(120), language: lang }).parse(req.body);
  if (getUserByEmail(body.email)) throw new HttpError(409, "An account with this email already exists", "email_taken");
  const user = createUser({ email: body.email, name: body.name, language: body.language, passwordHash: await bcrypt.hash(body.password, 12) });
  linkIdentity(user.id, "email", body.email);
  respond(req, res, user, true, "email");
});

authRouter.post("/login", async (req, res) => {
  const body = z.object({ email: emailSchema, password: z.string().min(1) }).parse(req.body);
  const user = getUserByEmail(body.email);
  // Compare against a dummy hash when the user is unknown to keep timing uniform.
  const ok = await bcrypt.compare(body.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !user.password_hash || !ok) throw new HttpError(401, "Incorrect email or password", "invalid_credentials");
  touchLogin(user.id);
  respond(req, res, user, false, "email");
});

authRouter.post("/demo", (req, res) => {
  if (!config.devLogin) throw new HttpError(404, "Not found");
  const body = z.object({ name: z.string().trim().max(60).optional(), language: lang }).parse(req.body ?? {});
  const { user, created } = findOrCreateFromProfile(
    { provider: "google", providerUserId: "demo-user", emailVerified: false, name: body.name || "Demo Sadhak" },
    body.language,
  );
  respond(req, res, user, created, "demo");
});

authRouter.post("/logout", requireAuth, (req, res) => {
  logActivity(req, userIdOf(req), "auth.logout");
  res.status(204).end();
});
