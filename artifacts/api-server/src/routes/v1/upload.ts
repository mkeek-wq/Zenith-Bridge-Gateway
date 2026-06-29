import express, { type Router, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: Router = express.Router();

/**
 * Upload directory
 */
const uploadDir = path.join(process.cwd(), "uploads/images");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Allowed image types only (CMS safe)
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Multer storage config
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-]/g, "");

    const unique = `${Date.now()}-${safeName}`;
    cb(null, unique);
  },
});

/**
 * File filter (security layer)
 */
const fileFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Images only."), false);
  }
  cb(null, true);
};

/**
 * Limit file size (5MB)
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/**
 * POST /api/v1/upload
 */
router.post("/", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const host = req.get("host");

const baseUrl =
  process.env.PUBLIC_BASE_URL ||
  `${req.protocol}://${host}`;

const url = `${baseUrl}/uploads/images/${req.file.filename}`;

  return res.json({
    url,
    filename: req.file.filename,
    type: req.file.mimetype,
    size: req.file.size,
  });
});

export default router;
