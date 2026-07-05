import "dotenv/config";

import app from "./app.js";
import { logger } from "./lib/logger.js";

/**
 * =========================
 * ENV VALIDATION (FAIL FAST)
 * =========================
 */

import "dotenv/config";

const requiredEnv = ["PORT", "DATABASE_URL", "JWT_SECRET", "ADMIN_PASSWORD"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

/**
 * =========================
 * PORT PARSING
 * =========================
 */
const port = Number(process.env.PORT);

if (!Number.isFinite(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

/**
 * =========================
 * START SERVER
 * =========================
 */
const server = app.listen(port, () => {
  logger.info(
    {
      port,
      env: process.env.NODE_ENV ?? "development",
      pid: process.pid,
    },
    "Server started"
  );
});

/**
 * =========================
 * GRACEFUL SHUTDOWN (IMPORTANT)
 * =========================
 */
const shutdown = (signal: string) => {
  logger.warn({ signal }, "Shutting down server");

  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });

  // force exit after 10s
  setTimeout(() => {
    logger.error("Forced shutdown");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/**
 * =========================
 * SAFETY NET
 * =========================
 */
process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  process.exit(1);
});
