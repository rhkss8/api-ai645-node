import { Request, Response } from 'express';
import { BoardPostUseCase } from '../usecases/BoardPostUseCase';
import { asyncHandler } from '../middlewares/errorHandler';
import { BoardCategory } from '@prisma/client';

export class BoardController {
  constructor(private boardPostUseCase: BoardPostUseCase) {}

  /**
   * 게시글 생성
   */
  public createPost = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = (req as any).user?.sub;
      const { category } = req.params;
      const { title, content, authorName, isImportant } = req.body;

      // 카테고리 검증
      if (!Object.values(BoardCategory).includes(category as BoardCategory)) {
        res.status(400).json({
          success: false,
          error: '유효하지 않은 카테고리입니다.',
          message: '카테고리는 NOTICE, SUGGESTION, PARTNERSHIP 중 하나여야 합니다.',
        });
        return;
      }

      // 필수 필드 검증 (모든 카테고리에서 작성자 이름 필수)
      if (!title || !content || !authorName) {
        res.status(400).json({
          success: false,
          error: '필수 필드가 누락되었습니다.',
          message: '제목, 내용, 작성자 이름은 필수입니다.',
        });
        return;
      }

      const result = await this.boardPostUseCase.createPost(
        {
          category: category as BoardCategory,
          title,
          content,
          authorName,
          isImportant: isImportant || false,
        },
        userId
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.post,
        message: '게시글이 성공적으로 생성되었습니다.',
      });
    }
  );

  /**
   * 게시글 조회 (단일)
   */
  public getPost = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const userId = (req as any).user?.sub;

      const result = await this.boardPostUseCase.getPost(id, userId);

      if (!result.success) {
        res.status(404).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        data: result.post,
      });
    }
  );

  /**
   * 게시글 목록 조회
   */
  public getPosts = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { category } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = (req as any).user?.sub;

      // 카테고리 검증
      if (!Object.values(BoardCategory).includes(category as BoardCategory)) {
        res.status(400).json({
          success: false,
          error: '유효하지 않은 카테고리입니다.',
          message: '카테고리는 NOTICE, SUGGESTION, PARTNERSHIP 중 하나여야 합니다.',
        });
        return;
      }

      const result = await this.boardPostUseCase.getPosts(
        category as BoardCategory,
        page,
        limit,
        userId
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        data: result.data,
      });
    }
  );

  /**
   * 게시글 수정
   */
  public updatePost = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const userId = (req as any).user?.sub;
      const { title, content, isImportant } = req.body;

      // 최소 하나의 필드는 수정되어야 함
      if (!title && !content && isImportant === undefined) {
        res.status(400).json({
          success: false,
          error: '수정할 내용이 없습니다.',
          message: '제목, 내용, 중요공지 여부 중 하나 이상을 수정해주세요.',
        });
        return;
      }

      const result = await this.boardPostUseCase.updatePost(
        id,
        {
          ...(title && { title }),
          ...(content && { content }),
          ...(isImportant !== undefined && { isImportant }),
        },
        userId
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        data: result.post,
        message: '게시글이 성공적으로 수정되었습니다.',
      });
    }
  );

  /**
   * 게시글 삭제
   */
  public deletePost = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const userId = (req as any).user?.sub;

      const result = await this.boardPostUseCase.deletePost(id, userId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        message: '게시글이 성공적으로 삭제되었습니다.',
      });
    }
  );

  /**
   * 내가 작성한 게시글 목록 조회
   */
  public getMyPosts = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = (req as any).user?.sub;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: '로그인이 필요합니다.',
        });
        return;
      }

      // Repository에서 직접 조회
      const { PrismaBoardPostRepository } = await import('../repositories/impl/PrismaBoardPostRepository');
      const { PrismaClient } = await import('@prisma/client');
      
      const prisma = new PrismaClient();
      const repository = new PrismaBoardPostRepository(prisma);
      
      try {
        const data = await repository.findByAuthorId(userId, page, limit);

        res.json({
          success: true,
          data,
        });
      } finally {
        await prisma.$disconnect();
      }
    }
  );
} 