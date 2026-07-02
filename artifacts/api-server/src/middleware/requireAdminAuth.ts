import type { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";

/**
 * Strict admin identity shape
 */
export interface AdminUser {
  username: string;
  role: "admin" | "editor" | "viewer";
}

/**
 * Request extension for authenticated routes
 */


/**
 * =========================
 * AUTH MIDDLEWARE (JWT)
 * =========================
 */
export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }

  try {
    const payload = verifyAdminToken(token);

    if (
      !payload ||
      typeof payload.username !== "string" ||
      !payload.username
    ) {
      res.status(401).json({ error: "invalid_token" });
      return;
    }

    const role =
      payload.role === "admin" ||
      payload.role === "editor" ||
      payload.role === "viewer"
        ? payload.role
        : "viewer";

    req.admin = {
      username: payload.username,
      role,
    };

    next();
  } catch (err) {
    logger.error({ err }, "JWT verification failed");
    res.status(401).json({ error: "invalid_token" });
    return;
  }
}
