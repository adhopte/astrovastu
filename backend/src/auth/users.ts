import { randomUUID } from "node:crypto";
import { getDb } from "../db/index.js";
import type { VerifiedProfile } from "./providers.js";

export interface UserRow {
  id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  language: string;
  password_hash: string | null;
  created_at: string;
  last_login_at: string | null;
}

export function publicUser(u: UserRow) {
  const providers = (getDb().prepare("SELECT provider FROM auth_identities WHERE user_id = ?").all(u.id) as { provider: string }[]).map((r) => r.provider);
  return { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatar_url, language: u.language, providers, createdAt: u.created_at };
}

export const getUser = (id: string) => getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
export const getUserByEmail = (email: string) => getDb().prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(email) as UserRow | undefined;

export function createUser(data: { email?: string | null; name: string; avatarUrl?: string | null; language?: string; passwordHash?: string | null }): UserRow {
  const id = randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare("INSERT INTO users (id, email, name, avatar_url, language, password_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, data.email ?? null, data.name, data.avatarUrl ?? null, data.language ?? "en", data.passwordHash ?? null, now, now);
  return getUser(id)!;
}

export function linkIdentity(userId: string, provider: string, providerUserId: string) {
  getDb()
    .prepare("INSERT OR IGNORE INTO auth_identities (provider, provider_user_id, user_id, created_at) VALUES (?, ?, ?, ?)")
    .run(provider, providerUserId, userId, new Date().toISOString());
}

export function touchLogin(userId: string) {
  getDb().prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(new Date().toISOString(), userId);
}

/**
 * Resolve a social login to a user. Existing identity wins; otherwise an
 * account with the same *verified* email is linked; otherwise a new user is created.
 */
export function findOrCreateFromProfile(p: VerifiedProfile, language?: string): { user: UserRow; created: boolean } {
  const db = getDb();
  const ident = db.prepare("SELECT user_id FROM auth_identities WHERE provider = ? AND provider_user_id = ?").get(p.provider, p.providerUserId) as
    | { user_id: string }
    | undefined;
  if (ident) {
    touchLogin(ident.user_id);
    return { user: getUser(ident.user_id)!, created: false };
  }
  if (p.email && p.emailVerified) {
    const existing = getUserByEmail(p.email);
    if (existing) {
      linkIdentity(existing.id, p.provider, p.providerUserId);
      if (!existing.avatar_url && p.avatarUrl) db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(p.avatarUrl, existing.id);
      touchLogin(existing.id);
      return { user: getUser(existing.id)!, created: false };
    }
  }
  const user = createUser({
    email: p.email && p.emailVerified ? p.email : null,
    name: p.name || p.email?.split("@")[0] || "Devotee",
    avatarUrl: p.avatarUrl,
    language,
  });
  linkIdentity(user.id, p.provider, p.providerUserId);
  return { user, created: true };
}
