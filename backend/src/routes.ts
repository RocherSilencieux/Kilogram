import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

import { authenticate, optionalAuthenticate } from "./auth";
import { AuthService } from "./services/AuthService";
import { AuthController } from "./controllers/AuthController";
import { PostService } from "./services/PostService";
import { PostController } from "./controllers/PostController";
import { CommentService } from "./services/CommentService";
import { CommentController } from "./controllers/CommentController";
import { LikeService } from "./services/LikeService";
import { LikeController } from "./controllers/LikeController";
import { UserService } from "./services/UserService";
import { UserController } from "./controllers/UserController";

const router = Router();
const prisma = new PrismaClient();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts; please try again later." },
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const authController = new AuthController(new AuthService(prisma));
const postController = new PostController(new PostService(prisma));
const commentController = new CommentController(new CommentService(prisma));
const likeController = new LikeController(new LikeService(prisma));
const userController = new UserController(new UserService(prisma));

// Auth Routes
router.post("/auth/register", authLimiter, authController.register);
router.post("/auth/login", authLimiter, authController.login);

// Post Routes
router.get("/posts", optionalAuthenticate, postController.getPosts);
router.post("/posts", authenticate, upload.single("image"), postController.createPost);
router.get("/posts/:id", optionalAuthenticate, postController.getPostById);
router.delete("/posts/:id", authenticate, postController.deletePost);

// Comment Routes
router.post("/posts/:id/comments", authenticate, commentController.addComment);
router.delete("/comments/:id", authenticate, commentController.deleteComment);

// Like Routes
router.post("/posts/:id/like", authenticate, likeController.addLike);
router.delete("/posts/:id/like", authenticate, likeController.removeLike);

// User Routes
router.get("/users/:id", userController.getUserById);
router.get("/users/:id/posts", optionalAuthenticate, userController.getUserPosts);

export default router;
