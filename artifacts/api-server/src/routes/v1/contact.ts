import { Router } from "express";

const router: Router = Router();

/**
 * TEMPORARY STUB
 * DB layer is not yet available in this environment.
 */
router.post("/", async (req, res): Promise<void> => {
  res.json({
    success: true,
    message: "Contact endpoint temporarily disabled (DB not connected)",
  });
});

export default router;
