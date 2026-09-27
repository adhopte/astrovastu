import type { Request } from "express";
import { getDb } from "../db/index.js";

export type ActivityAction =
  | "auth.signup" | "auth.login" | "auth.logout"
  | "kundali.create" | "kundali.view" | "kundali.delete" | "kundali.ai_reading"
  | "vastu.create" | "vastu.view" | "vastu.delete" | "vastu.ai_detect"
  | "consultation.create" | "consultation.view"
  | "profile.update" | "account.delete";

export function logActivity(
  req: Request | null,
  userId: string | null,
  action: ActivityAction,
  entity?: { type: string; id: string },
  metadata?: Record<string, unknown>,
) {
  getDb()
    .prepare("INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata_json, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(
      userId,
      action,
      entity?.type ?? null,
      entity?.id ?? null,
      metadata ? JSON.stringify(metadata) : null,
      req?.ip ?? null,
      req?.get("user-agent")?.slice(0, 255) ?? null,
      new Date().toISOString(),
    );
}
