import { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../services/AuthService";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
});

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public register = async (req: Request, res: Response): Promise<Response> => {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid data", details: validation.error.format() });
    }

    try {
      const { email, username, password } = validation.data;
      const authResult = await this.authService.registerUser(email, username, password);
      return res.json(authResult);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration error";
      if (message === "EMAIL_IN_USE") {
        return res.status(400).json({ error: "Email already in use" });
      }
      return res.status(500).json({ error: "Server error during registration" });
    }
  };

  public login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password required" });
    }

    try {
      const authResult = await this.authService.loginUser(email, password);
      return res.json(authResult);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login error";
      if (message === "INVALID_CREDENTIALS") {
        return res.status(200).json({ error: "Invalid credentials" });
      }
      return res.status(500).json({ error: "Server error during login" });
    }
  };
}
