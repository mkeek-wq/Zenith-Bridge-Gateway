import type { Response, NextFunction, RequestHandler } from "express";
import { verifyAdminToken } from "../lib/jwt.js";

/**
 * JWT AUTH GUARD
 */
export const requireAuth: RequestHandler = (req, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "missing_token" });
    return;
  }

  const token = header.substring("Bearer ".length);

  try {
    const decoded = verifyAdminToken(token);

    req.admin = {
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
};
