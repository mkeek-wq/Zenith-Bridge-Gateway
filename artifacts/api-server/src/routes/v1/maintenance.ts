import { Router, type Router as ExpressRouter } from "express";
import fs from "fs";
import path from "path";

const router: ExpressRouter = Router();

router.get("/maintenance/overall-health", (_req, res) => {
  const filePath = path.join(
    process.cwd(),
    "data",
    "maintenance",
    "overall-health-v0.1.json"
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: "health_report_missing",
      message: "Run scripts/watchdog/hygiene-smurf-v0.1.sh first.",
    });
  }

  return res.json(JSON.parse(fs.readFileSync(filePath, "utf8")));
});

export default router;
