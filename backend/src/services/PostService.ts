import { PrismaClient } from "@prisma/client";
import { PostFeedItemDto, PostDetailDto } from "../types/dtos";

export class PostService {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async getPostFeed(currentUserId?: string): Promise<PostFeedItemDto[]> {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, username: true } },
        comments: {
          include: { author: { select: { id: true, username: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { likes: true, comments: true },
        },
        ...(currentUserId
          ? {
              likes: {
                where: { userId: currentUserId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    return posts.map((post) => {
      const userLikes = "likes" in post && Array.isArray(post.likes) ? post.likes : [];
      return {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt,
        created_at: post.createdAt,
        author: post.author,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        comments: post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          authorName: comment.author.username,
          createdAt: comment.createdAt,
        })),
        isLiked: currentUserId ? userLikes.length > 0 : false,
      };
    });
  }

  public async getPostById(postId: string, currentUserId?: string): Promise<PostDetailDto | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, username: true } },
        comments: {
          include: { author: { select: { id: true, username: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { likes: true, comments: true } },
        ...(currentUserId
          ? {
              likes: {
                where: { userId: currentUserId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    if (!post) {
      return null;
    }

    const userLikes = "likes" in post && Array.isArray(post.likes) ? post.likes : [];
    return {
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      created_at: post.createdAt,
      author: post.author,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        authorName: comment.author.username,
        createdAt: comment.createdAt,
      })),
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      isLiked: currentUserId ? userLikes.length > 0 : false,
    };
  }

  public async createPost(content: string, authorId: string, imageUrl?: string | null) {
    return this.prisma.post.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        authorId,
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });
  }

  public async deletePost(postId: string, requestingUserId: string, requestingUserRole?: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    if (post.authorId !== requestingUserId && requestingUserRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    await this.prisma.post.delete({ where: { id: postId } });
    return true;
  }
}
