import { BoardCategory } from '@prisma/client';

export interface BoardPost {
  id: string;
  category: BoardCategory;
  title: string;
  content: string;
  authorName: string;
  authorId?: string | null;
  isImportant: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateBoardPostData {
  category: BoardCategory;
  title: string;
  content: string;
  authorName: string;
  authorId?: string;
  isImportant?: boolean;
}

export interface UpdateBoardPostData {
  title?: string;
  content?: string;
  isImportant?: boolean;
}

export interface BoardPostWithAuthor extends BoardPost {
  author?: {
    id: string;
    nickname: string;
    role: string;
  } | null;
}

export interface BoardPostListResponse {
  posts: BoardPostWithAuthor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 