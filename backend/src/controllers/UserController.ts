import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { getParamString } from "../utils/params";

export class UserController {
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  public getUserById = async (req: Request, res: Response): Promise<Response> => {
    const userId = getParamString(req.params.id);
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json(user);
    } catch (err: unknown) {
      console.error("Error fetching user profile:", err);
      return res.status(500).json({ error: "Server error fetching user" });
    }
  };

  public getUserPosts = async (req: Request, res: Response): Promise<Response> => {
    const userId = getParamString(req.params.id);
    try {
      const posts = await this.userService.getUserPosts(userId, req.userId);
      return res.json(posts);
    } catch (err: unknown) {
      console.error("Error fetching user posts:", err);
      return res.status(500).json({ error: "Server error fetching user posts" });
    }
  };
}
