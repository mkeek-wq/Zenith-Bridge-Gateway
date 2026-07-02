import { Router, type Router as ExpressRouter } from "express";

import upload from "./upload.js";
import authRouter from "./auth.js";
import articlesRouter from "./articles.js";
import adminRouter from "./admin.js";
import contactRouter from "./contact.js";
import healthRouter from "./health.js";

const router: ExpressRouter = Router();

/**
 * Core system routes
 */
router.use("/health", healthRouter);
router.use("/auth", authRouter);

/**
 * CMS content layer
 */
router.use("/articles", articlesRouter);

// ⚠️ DISABLED: legacy admin API (duplicate of /auth + /articles)
// router.use("/admin", adminRouter);

/**
 * Upload system (TipTap images)
 */
router.use("/upload", upload);

/**
 * Public contact form
 */
router.use("/contact", contactRouter);

export default router;
