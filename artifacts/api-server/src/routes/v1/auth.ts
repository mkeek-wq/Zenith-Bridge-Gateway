import express, { type Request, type Response, type Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { signAdminToken } from "../../lib/jwt.js";
import rateLimit from "express-rate-limit";

const router: Router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * =========================
 * LOGIN (JWT)
 * =========================
 */
router.post("/login", loginLimiter, (req: Request, res: Response) => {
  const { password } = req.body;

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({
      error: "server_misconfig",
      message: "ADMIN_PASSWORD not configured",
    });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "invalid_credentials",
    });
  }

  const user = {
    username: "admin",
    role: "admin" as const,
  };

  const token = signAdminToken(user);

  return res.json({
    authenticated: true,
    token,
    user,
  });
});

/**
 * =========================
 * ME (JWT CHECK)
 * =========================
 */
router.get("/me", requireAuth, (req: Request, res: Response) => {
  return res.json({
    authenticated: true,
    user: req.admin,
  });
});

/**
 * =========================
 * LOGOUT (JWT CLIENT-SIDE)
 * =========================
 */
router.post("/logout", (_req: Request, res: Response) => {
  return res.json({
    authenticated: false,
  });
});

export default router;
