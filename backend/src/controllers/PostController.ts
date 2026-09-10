import { Request, Response } from "express";
import { PostService } from "../services/PostService";
import { getParamString } from "../utils/params";

export class PostController {
  private readonly postService: PostService;

  constructor(postService: PostService) {
    this.postService = postService;
  }

  public getPosts = async (req: Request, res: Response): Promise<Response> => {
    try {
      const feed = await this.postService.getPostFeed(req.userId);
      return res.json(feed);
    } catch (err: unknown) {
      console.error("Error in getPosts:", err);
      return res.status(500).json({ error: "Server error fetching posts" });
    }
  };

  public getPostById = async (req: Request, res: Response): Promise<Response> => {
    const id = getParamString(req.params.id);
    try {
      const post = await this.postService.getPostById(id, req.userId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.json(post);
    } catch (err: unknown) {
      console.error("Error in getPostById:", err);
      return res.status(500).json({ error: "Server error fetching post" });
    }
  };

  public createPost = async (req: Request, res: Response): Promise<Response> => {
    const { content } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Post content cannot be empty" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    try {
      const newPost = await this.postService.createPost(content, userId, imageUrl);
      return res.json(newPost);
    } catch (err: unknown) {
      console.error("Error creating post:", err);
      return res.status(500).json({ error: "Server error creating post" });
    }
  };

  public deletePost = async (req: Request, res: Response): Promise<Response> => {
    const id = getParamString(req.params.id);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await this.postService.deletePost(id, userId, req.userRole);
      return res.json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete error";
      if (message === "POST_NOT_FOUND") {
        return res.status(404).json({ error: "Post not found" });
      }
      if (message === "UNAUTHORIZED") {
        return res.status(403).json({ error: "Unauthorized action" });
      }
      return res.status(500).json({ error: "Server error deleting post" });
    }
  };
}
