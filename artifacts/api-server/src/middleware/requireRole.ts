import type { Request, Response, NextFunction } from "express";

export function requireRole(roles: Array<"admin" | "editor" | "viewer">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    if (!roles.includes(req.admin.role)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    next();
  };
}
