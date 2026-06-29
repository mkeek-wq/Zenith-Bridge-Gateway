import jwt from "jsonwebtoken";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required but not set`);
  }
  return value;
}

// IMPORTANT: lazy-load at runtime, not import-time crash
function getJwtSecret(): string {
  return getEnv("JWT_SECRET");
}

export interface AdminJwtPayload {
  username: string;
  role: "admin" | "editor" | "viewer";
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "1d",
  });
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  return jwt.verify(token, getJwtSecret()) as AdminJwtPayload;
}
