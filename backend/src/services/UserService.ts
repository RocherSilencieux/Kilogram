import { PrismaClient } from "@prisma/client";
import { UserResponseDto, PostFeedItemDto } from "../types/dtos";

export class UserService {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async getUserById(userId: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  public async getUserPosts(targetUserId: string, currentUserId?: string): Promise<PostFeedItemDto[]> {
    const posts = await this.prisma.post.findMany({
      where: { authorId: targetUserId },
      orderBy: { createdAt: "desc" },
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
}
