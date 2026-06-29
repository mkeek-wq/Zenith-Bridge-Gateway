import type { Request } from "express";

export interface AdminUser {
  username: string;
  role: "admin" | "editor" | "viewer";
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
    }
  }
}

export {};
