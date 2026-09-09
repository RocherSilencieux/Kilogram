import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { authenticate, generateToken } from "./auth";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { request } from "http";

const router = Router();
const prisma = new PrismaClient();

//ad rateLimit for limit the number of requests per IP address
const authLimiter = rateLimit({

  windowMs: 15 * 60 * 1000, 

  max: 10, 

  message: { error: "Too many attempts; please try again later." }

});

//ad zod for validate each incoming data schema
const registerSchema = z.object({

  email: z.string().email(),

  username: z.string().min(3).max(30),

  password: z.string().min(8),

});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({

  storage: multer.diskStorage({

    destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),

    filename: (req, file, cb) => {

      const ext = path.extname(file.originalname).toLowerCase();

      //random id secure UUID with crypto
      cb(null, `${crypto.randomUUID()}${ext}`);

    },

  }),

  //add limit size
  limits: { fileSize: 5 * 1024 * 1024 }, 

  //Files Filter authorize
  fileFilter: (req, file, cb) => {

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    cb(null, allowed.includes(file.mimetype));

  },

});



// ==================== AUTH ====================

//call authLimiter and zod for validate register
router.post("/auth/register", authLimiter, async (req: Request, res: Response) => {


  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: "invalid data", details: validation.error.format() });
  }

  const { email, username, password } = validation.data;
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: "Email déjà utilisé" });
  }

  const hashed = bcrypt.hashSync(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashed,
    },
  });

  const token = generateToken(user.id, user.role);
  res.json({
    token,
    user: { id: user.id, email: user.email, username: user.username },
  });
});

//call authLimiter
router.post("/auth/login", authLimiter, (req: Request, res: Response) => {
  const { email, password } = req.body;

  prisma.user
    .findUnique({ where: { email } })
    .then((user) => {
      if (!user) {
        return res.status(200).json({ error: "Invalid credentials" });
      }

      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) {
        return res.status(200).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id, user.role);
      res.json({
        token,
        user: { id: user.id, email: user.email, username: user.username },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    });
});

// ==================== POSTS ====================

// get the feed of all posts, most recent first
async function getPosts(req: Request, res: Response) {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  const feed = [];

  for (const post of posts) {
    // get the author from the database
    const author = await prisma.user.findUnique({
      where: { id: post.authorId },
    });
    const likeCount = await prisma.like.count({ where: { postId: post.id } });
    const commentCount = await prisma.comment.count({
      where: { postId: post.id },
    });

    feed.push({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      created_at: post.createdAt,
      author: author ? { id: author.id, username: author.username } : null,
      likeCount,
      commentCount,
    });
  }

  res.json(feed);
}

async function handleCreatePost(req: Request, res: Response) {
  const { content } = req.body;
  const userId = req.userId;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const post = await prisma.post.create({
    data: {
      content,
      imageUrl,
      authorId: userId,
    },
  });

  res.json(post);
}

async function getPostById(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true } },
      comments: {
        include: { author: { select: { id: true, username: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const likeCount = await prisma.like.count({ where: { postId: id } });

  res.json({
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    author: post.author,
    comments: post.comments,
    likeCount,
  });
}

async function deletePost(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const post = await prisma.post.findUnique({where: {id}})

  if(!post) {
    return res.status(404).json({error: "Post not found"})
  }
  if (post.authorId !== req.userId && req.userRole !== "ADMIN"){
    return res.status(403).json({error: "Unauthorized action"})
  }

  await prisma.post.delete({ where: { id } });
  res.json({ success: true });
}


router.get("/posts", getPosts);
router.post("/posts", authenticate, upload.single("image"), handleCreatePost);
router.get("/posts/:id", getPostById);
router.delete("/posts/:id", authenticate, deletePost);

// ==================== COMMENTS ====================

router.post(
  "/posts/:id/comments",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: id,
        authorId: userId,
      },
      include: { author: true },
    });

    res.json(comment);
  }
);

router.delete(
  "/comments/:id",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.authorId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ error: "Not authorized" });
    }
    await prisma.comment.delete({ where: { id } });
    res.json({ success: true });
  }
);

// ==================== LIKES ====================

router.post(
  "/posts/:id/like",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;

    const like = await prisma.like.create({
      data: {
        postId: id,
        userId,
      },
    });

    res.json(like);
  }
);

router.delete(
  "/posts/:id/like",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;

    const like = await prisma.like.findFirst({
      where: { postId: id, userId },
    });

    if (!like) {
      return res.status(200).json({ error: "Like not found" });
    }

    await prisma.like.delete({ where: { id: like.id } });
    res.json({ success: true });
  }
);

// ==================== USERS ====================

// fetch a user by id
// selected only usefull information and got rid of sensible information like the hashed password
function fetch_user(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  prisma.user.findUnique({ where: { id },
     select:{
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true
      } }).then((user) => {
    res.json(user);
  });
}

async function getUserPosts(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const posts = await prisma.post.findMany({
    where: { authorId: id },
    orderBy: { createdAt: "desc" },
  });

  res.json(posts);
}

router.get("/users/:id", fetch_user);
router.get("/users/:id/posts", getUserPosts);

export default router;
