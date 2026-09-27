import { OAuth2Client } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../config.js";
import { HttpError } from "../lib/http.js";

export interface VerifiedProfile {
  provider: "google" | "facebook" | "apple";
  providerUserId: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  avatarUrl?: string;
}

const googleClient = new OAuth2Client();

export async function verifyGoogle(idToken: string): Promise<VerifiedProfile> {
  if (config.google.clientIds.length === 0) throw new HttpError(503, "Google login is not configured", "provider_disabled");
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: config.google.clientIds });
    const p = ticket.getPayload();
    if (!p?.sub) throw new Error("no subject");
    return { provider: "google", providerUserId: p.sub, email: p.email, emailVerified: Boolean(p.email_verified), name: p.name, avatarUrl: p.picture };
  } catch {
    throw new HttpError(401, "Invalid Google token", "invalid_token");
  }
}

export async function verifyFacebook(accessToken: string): Promise<VerifiedProfile> {
  const { appId, appSecret } = config.facebook;
  if (!appId || !appSecret) throw new HttpError(503, "Facebook login is not configured", "provider_disabled");
  // Confirm the token was issued for *our* app before trusting it.
  const debug = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`,
  ).then((r) => r.json() as Promise<{ data?: { is_valid?: boolean; app_id?: string; user_id?: string } }>);
  if (!debug.data?.is_valid || debug.data.app_id !== appId) throw new HttpError(401, "Invalid Facebook token", "invalid_token");
  const me = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`).then(
    (r) => r.json() as Promise<{ id: string; name?: string; email?: string; picture?: { data?: { url?: string } } }>,
  );
  if (me.id !== debug.data.user_id) throw new HttpError(401, "Invalid Facebook token", "invalid_token");
  // Facebook only returns confirmed emails.
  return { provider: "facebook", providerUserId: me.id, email: me.email, emailVerified: Boolean(me.email), name: me.name, avatarUrl: me.picture?.data?.url };
}

const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export async function verifyApple(identityToken: string, fullName?: string): Promise<VerifiedProfile> {
  if (config.apple.audiences.length === 0) throw new HttpError(503, "Apple login is not configured", "provider_disabled");
  try {
    const { payload } = await jwtVerify(identityToken, appleJwks, { issuer: "https://appleid.apple.com", audience: config.apple.audiences });
    return {
      provider: "apple",
      providerUserId: String(payload.sub),
      email: payload.email as string | undefined,
      emailVerified: payload.email_verified === true || payload.email_verified === "true",
      name: fullName,
    };
  } catch {
    throw new HttpError(401, "Invalid Apple token", "invalid_token");
  }
}
