import { Request, Response } from "express";
import { LikeService } from "../services/LikeService";
import { getParamString } from "../utils/params";

export class LikeController {
  private readonly likeService: LikeService;

  constructor(likeService: LikeService) {
    this.likeService = likeService;
  }

  public addLike = async (req: Request, res: Response): Promise<Response> => {
    const postId = getParamString(req.params.id);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const result = await this.likeService.addLike(postId, userId);
      return res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Like error";
      if (message === "POST_NOT_FOUND") {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(500).json({ error: "Could not like post" });
    }
  };

  public removeLike = async (req: Request, res: Response): Promise<Response> => {
    const postId = getParamString(req.params.id);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const result = await this.likeService.removeLike(postId, userId);
      return res.json(result);
    } catch (err: unknown) {
      return res.status(500).json({ error: "Could not remove like" });
    }
  };
}
