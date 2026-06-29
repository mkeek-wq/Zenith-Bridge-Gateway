import "dotenv/config";

import path from "path";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { createRequire } from "module";

import v1Router from "./routes/v1/index.js";
import adminIntelligencePreviewRoutes from "./routes/admin-intelligence-preview.js";
import adminIntelligencePromoteRoutes from "./routes/admin-intelligence-promote.js";
import { logger } from "./lib/logger.js";
import { ensureUploadDir } from "./config/storage.js";

const require = createRequire(import.meta.url);
const pinoHttp = require("pino-http");

ensureUploadDir();

const app: Express = express();

app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://37.97.224.215:5173",
  "https://zenithnovabridgewave.com",
  "https://www.zenithnovabridgewave.com",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const csrfAllowedOrigins = new Set([
  "http://localhost:5173",
  "http://37.97.224.215:5173",
  "https://zenithnovabridgewave.com",
  "https://www.zenithnovabridgewave.com",
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (req.method === "GET" || req.method === "HEAD") {
    return next();
  }

  if (!origin) {
    return next();
  }

  if (!csrfAllowedOrigins.has(origin)) {
    return res.status(403).json({
      error: "csrf_blocked",
      reason: "invalid_origin",
    });
  }

  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/admin/intelligence-preview", adminIntelligencePreviewRoutes);
app.use("/api/admin/intelligence-promote", adminIntelligencePromoteRoutes);

app.use("/api/v1", v1Router);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "zenith-api",
    env: process.env.NODE_ENV ?? "development",
    time: new Date().toISOString(),
  });
});

export default app;
