import path from "path";
import fs from "fs";

/**
 * Centralized upload storage configuration
 * Single source of truth for all file uploads
 */
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * Ensures upload directory exists at runtime
 * Safe and idempotent
 */
export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}
