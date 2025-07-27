import { BoardCategory } from '@prisma/client';
import { BoardPost, CreateBoardPostData, UpdateBoardPostData, BoardPostListResponse } from '../entities/BoardPost';

export interface IBoardPostRepository {
  // 게시글 생성
  create(data: CreateBoardPostData): Promise<BoardPost>;
  
  // 게시글 조회 (단일)
  findById(id: string, userId?: string): Promise<BoardPost | null>;
  
  // 게시글 목록 조회 (카테고리별)
  findByCategory(
    category: BoardCategory,
    page: number,
    limit: number,
    userId?: string
  ): Promise<BoardPostListResponse>;
  
  // 게시글 수정
  update(id: string, data: UpdateBoardPostData): Promise<BoardPost | null>;
  
  // 게시글 삭제 (소프트 삭제)
  delete(id: string): Promise<boolean>;
  
  // 조회수 증가
  incrementViewCount(id: string): Promise<void>;
  
  // 작성자별 게시글 조회
  findByAuthorId(authorId: string, page: number, limit: number): Promise<BoardPostListResponse>;
  
  // 전체 게시글 수 조회
  countByCategory(category: BoardCategory): Promise<number>;
} 