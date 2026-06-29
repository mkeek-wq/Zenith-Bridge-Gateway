import type { Router } from "express";
import { Router as ExpressRouter } from "express";

const router: Router = ExpressRouter();

/**
 * Health endpoint (no external contract dependency)
 * Keeps API-server decoupled from api-zod version drift
 */
router.get("/", (_req, res) => {
  res.json({
    status: "ok",
  });
});

export default router;
