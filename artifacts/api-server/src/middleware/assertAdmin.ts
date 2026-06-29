import type { Request } from "express";

export function assertAdmin(req: Request) {
  if (!req.admin) {
    throw new Error("UNAUTHORIZED_ADMIN_ACCESS");
  }

  return req.admin;
}
