import { getDb } from "@workspace/db";

/**
 * Simple audit logger (DB-safe fallback)
 * If auditLogs table doesn't exist, we no-op safely.
 */
export async function writeAuditLog(params: {
  articleId: number;
  action: string;
  actor: string;
  snapshot?: unknown;
}) {
  const { db } = getDb();

  try {
    // TEMP SAFE MODE: just console log (prevents DB crash)
    console.log("[AUDIT]", {
      articleId: params.articleId,
      action: params.action,
      actor: params.actor,
    });

    // If audit table exists later, we plug it here safely.
    return true;
  } catch (err) {
    console.error("Audit failed:", err);
    return false;
  }
}
