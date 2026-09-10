import { PrismaClient } from "@prisma/client";

export class CommentService {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async addComment(postId: string, userId: string, content: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    return this.prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });
  }

  public async deleteComment(commentId: string, requestingUserId: string, requestingUserRole?: string): Promise<boolean> {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new Error("COMMENT_NOT_FOUND");
    }

    if (comment.authorId !== requestingUserId && requestingUserRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
    return true;
  }
}
