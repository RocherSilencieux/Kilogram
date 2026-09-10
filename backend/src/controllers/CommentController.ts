import { Request, Response } from "express";
import { CommentService } from "../services/CommentService";
import { getParamString } from "../utils/params";

export class CommentController {
  private readonly commentService: CommentService;

  constructor(commentService: CommentService) {
    this.commentService = commentService;
  }

  public addComment = async (req: Request, res: Response): Promise<Response> => {
    const postId = getParamString(req.params.id);
    const { content } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    try {
      const comment = await this.commentService.addComment(postId, userId, content);
      return res.json(comment);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Comment error";
      if (message === "POST_NOT_FOUND") {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(500).json({ error: "Server error creating comment" });
    }
  };

  public deleteComment = async (req: Request, res: Response): Promise<Response> => {
    const commentId = getParamString(req.params.id);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await this.commentService.deleteComment(commentId, userId, req.userRole);
      return res.json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete comment error";
      if (message === "COMMENT_NOT_FOUND") {
        return res.status(404).json({ error: "Comment not found" });
      }
      if (message === "UNAUTHORIZED") {
        return res.status(403).json({ error: "Not authorized" });
      }
      return res.status(500).json({ error: "Server error deleting comment" });
    }
  };
}
