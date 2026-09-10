import { PrismaClient } from "@prisma/client";
import { LikeResponseDto } from "../types/dtos";

export class LikeService {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async addLike(postId: string, userId: string): Promise<LikeResponseDto> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    await this.prisma.like.upsert({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
      create: {
        postId,
        userId,
      },
      update: {},
    });

    const likeCount = await this.prisma.like.count({ where: { postId } });
    return { success: true, likeCount, isLiked: true };
  }

  public async removeLike(postId: string, userId: string): Promise<LikeResponseDto> {
    await this.prisma.like.deleteMany({
      where: { postId, userId },
    });

    const likeCount = await this.prisma.like.count({ where: { postId } });
    return { success: true, likeCount, isLiked: false };
  }
}
