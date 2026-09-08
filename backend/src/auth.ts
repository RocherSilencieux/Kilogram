import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// generate a token for a user, no expiration
// added an expiration date and the server can't start if JWT_SECRET insn't defined
export function generateToken(userId: string, role: string): string {
  if (!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not defined in this environment")
  }
  return jwt.sign({ userId, role }, JWT_SECRET,{ expiresIn:"7d"});
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    (req as any).userId = decoded.userId;
    (req as any).userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
