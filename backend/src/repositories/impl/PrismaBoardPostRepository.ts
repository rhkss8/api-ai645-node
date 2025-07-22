import { PrismaClient, BoardCategory } from '@prisma/client';
import { IBoardPostRepository } from '../IBoardPostRepository';
import { BoardPost, CreateBoardPostData, UpdateBoardPostData, BoardPostListResponse } from '../../entities/BoardPost';

export class PrismaBoardPostRepository implements IBoardPostRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateBoardPostData): Promise<BoardPost> {
    const post = await this.prisma.boardPost.create({
      data: {
        category: data.category,
        title: data.title,
        content: data.content,
        authorName: data.authorName,
        authorId: data.authorId,
        isImportant: data.isImportant || false,
      },
    });

    return post as BoardPost;
  }

  async findById(id: string, userId?: string): Promise<BoardPost | null> {
    const post = await this.prisma.boardPost.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            role: true,
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    // 권한 검증
    if (post.category === 'PARTNERSHIP') {
      // 제휴문의는 작성자와 관리자만 볼 수 있음
      if (!userId) {
        return null;
      }
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN' && post.authorId !== userId) {
        return null;
      }
    } else if (post.category === 'SUGGESTION') {
      // 건의게시판은 작성자와 관리자만 볼 수 있음
      if (!userId) {
        return null;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN' && post.authorId !== userId) {
        return null;
      }
    }

    return post as BoardPost;
  }

  async findByCategory(
    category: BoardCategory,
    page: number,
    limit: number,
    userId?: string
  ): Promise<BoardPostListResponse> {
    const offset = (page - 1) * limit;

    // 권한에 따른 필터링 조건
    let whereCondition: any = {
      category,
      deletedAt: null,
    };

    // 제휴문의는 작성자와 관리자만 볼 수 있음
    if (category === 'PARTNERSHIP') {
      if (!userId) {
        return {
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        whereCondition.authorId = userId;
      }
    }

    // 건의게시판은 작성자와 관리자만 볼 수 있음
    if (category === 'SUGGESTION') {
      if (!userId) {
        return {
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        whereCondition.authorId = userId;
      }
    }

    const [posts, total] = await Promise.all([
      this.prisma.boardPost.findMany({
        where: whereCondition,
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              role: true,
            },
          },
        },
        orderBy: [
          { isImportant: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      this.prisma.boardPost.count({
        where: whereCondition,
      }),
    ]);

    return {
      posts: posts as BoardPost[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async update(id: string, data: UpdateBoardPostData): Promise<BoardPost | null> {
    const post = await this.prisma.boardPost.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.isImportant !== undefined && { isImportant: data.isImportant }),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            role: true,
          },
        },
      },
    });

    return post as BoardPost;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.boardPost.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.boardPost.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  async findByAuthorId(authorId: string, page: number, limit: number): Promise<BoardPostListResponse> {
    const offset = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.boardPost.findMany({
        where: {
          authorId,
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              role: true,
            },
          },
        },
        orderBy: [
          { isImportant: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      this.prisma.boardPost.count({
        where: {
          authorId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      posts: posts as BoardPost[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async countByCategory(category: BoardCategory): Promise<number> {
    return this.prisma.boardPost.count({
      where: {
        category,
        deletedAt: null,
      },
    });
  }
} 