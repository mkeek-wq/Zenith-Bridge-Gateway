import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * Legacy admin router
 *
 * This route tree is intentionally disabled from active use.
 *
 * Current CMS API paths:
 * - /api/v1/auth
 * - /api/v1/articles
 *
 * Do not add login, article CRUD, or seed routes here.
 */

router.get("/status", (_req, res) => {
  res.status(410).json({
    error: "legacy_admin_api_disabled",
    message: "Use /api/v1/auth and /api/v1/articles instead.",
  });
});

export default router;
