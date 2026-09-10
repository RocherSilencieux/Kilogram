import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface TokenPayload {
  userId: string;
  role: string;
}

function isTokenPayload(decoded: unknown): decoded is TokenPayload {
  if (typeof decoded !== "object" || decoded === null) {
    return false;
  }
  const payload = decoded as Record<string, unknown>;
  return typeof payload.userId === "string" && typeof payload.role === "string";
}

export function generateToken(userId: string, role: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment");
  }
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function authenticate(req: Request, res: Response, next: NextFunction): void | Response {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const decoded: unknown = jwt.verify(token, JWT_SECRET);
    if (!isTokenPayload(decoded)) {
      return res.status(401).json({ error: "Invalid token payload" });
    }
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header) {
    return next();
  }

  const token = header.split(" ")[1];
  if (!token) {
    return next();
  }

  try {
    const decoded: unknown = jwt.verify(token, JWT_SECRET);
    if (isTokenPayload(decoded)) {
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    }
  } catch {
    // Continue as guest if token is invalid or expired
  }
  next();
}
