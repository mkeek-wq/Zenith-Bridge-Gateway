import { type Request, type Response, type NextFunction } from "express";

export default function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.admin || req.admin.role !== "admin") {
    return res.status(401).json({
      error: "unauthorized",
    });
  }

  next();
}
