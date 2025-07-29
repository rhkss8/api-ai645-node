import { BoardCategory } from '@prisma/client';
import { IBoardPostRepository } from '../repositories/IBoardPostRepository';
import { CreateBoardPostData, UpdateBoardPostData, BoardPostListResponse } from '../entities/BoardPost';
import { sanitizeAndValidateInput } from '../utils/security';

export class BoardPostUseCase {
  constructor(private boardPostRepository: IBoardPostRepository) {}

  /**
   * 게시글 생성
   */
  async createPost(data: CreateBoardPostData, userId?: string): Promise<{ success: boolean; post?: any; error?: string }> {
    try {
      // 입력값 검증 및 정제
      const validation = sanitizeAndValidateInput(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // 모든 카테고리에서 로그인 필요
      if (!userId) {
        return {
          success: false,
          error: '로그인이 필요합니다.',
        };
      }

      const sanitizedData = {
        ...data,
        ...validation.sanitized,
        authorId: userId, // 모든 카테고리에서 토큰의 userId를 authorId로 사용
      };

      const post = await this.boardPostRepository.create(sanitizedData);

      return {
        success: true,
        post,
      };
    } catch (error) {
      console.error('게시글 생성 오류:', error);
      return {
        success: false,
        error: '게시글 생성에 실패했습니다.',
      };
    }
  }

  /**
   * 게시글 조회 (단일)
   */
  async getPost(id: string, userId?: string): Promise<{ success: boolean; post?: any; error?: string }> {
    try {
      const post = await this.boardPostRepository.findById(id, userId);
      
      if (!post) {
        return {
          success: false,
          error: '게시글을 찾을 수 없거나 볼 권한이 없습니다.',
        };
      }

      // 조회수 증가
      await this.boardPostRepository.incrementViewCount(id);

      return {
        success: true,
        post,
      };
    } catch (error) {
      console.error('게시글 조회 오류:', error);
      return {
        success: false,
        error: '게시글 조회에 실패했습니다.',
      };
    }
  }

  /**
   * 게시글 목록 조회
   */
  async getPosts(
    category: BoardCategory,
    page: number = 1,
    limit: number = 20,
    userId?: string
  ): Promise<{ success: boolean; data?: BoardPostListResponse; error?: string }> {
    try {
      const data = await this.boardPostRepository.findByCategory(category, page, limit, userId);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('게시글 목록 조회 오류:', error);
      return {
        success: false,
        error: '게시글 목록 조회에 실패했습니다.',
      };
    }
  }

  /**
   * 게시글 수정
   */
  async updatePost(
    id: string,
    data: UpdateBoardPostData,
    userId?: string
  ): Promise<{ success: boolean; post?: any; error?: string }> {
    try {
      // 게시글 존재 확인
      const existingPost = await this.boardPostRepository.findById(id, userId);
      if (!existingPost) {
        return {
          success: false,
          error: '게시글을 찾을 수 없습니다.',
        };
      }

      // 수정 권한 체크
      const hasPermission = await this.checkUpdatePermission(existingPost, userId);
      if (!hasPermission) {
        return {
          success: false,
          error: '이 게시글을 수정할 권한이 없습니다.',
        };
      }

      // 입력값 검증 및 정제
      const validation = sanitizeAndValidateInput(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      const sanitizedData = {
        ...data,
        ...validation.sanitized,
      };

      const post = await this.boardPostRepository.update(id, sanitizedData);

      return {
        success: true,
        post,
      };
    } catch (error) {
      console.error('게시글 수정 오류:', error);
      return {
        success: false,
        error: '게시글 수정에 실패했습니다.',
      };
    }
  }

  /**
   * 게시글 삭제
   */
  async deletePost(id: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 게시글 존재 확인
      const existingPost = await this.boardPostRepository.findById(id, userId);
      if (!existingPost) {
        return {
          success: false,
          error: '게시글을 찾을 수 없습니다.',
        };
      }

      // 삭제 권한 체크
      const hasPermission = await this.checkDeletePermission(existingPost, userId);
      if (!hasPermission) {
        return {
          success: false,
          error: '이 게시글을 삭제할 권한이 없습니다.',
        };
      }

      const success = await this.boardPostRepository.delete(id);

      return {
        success,
        error: success ? undefined : '게시글 삭제에 실패했습니다.',
      };
    } catch (error) {
      console.error('게시글 삭제 오류:', error);
      return {
        success: false,
        error: '게시글 삭제에 실패했습니다.',
      };
    }
  }

  /**
   * 읽기 권한 체크
   */
  private async checkReadPermission(post: any, userId?: string): Promise<boolean> {
    // 공지사항은 누구나 읽기 가능
    if (post.category === 'NOTICE') {
      return true;
    }

    // 제휴문의는 작성자와 관리자만 읽기 가능
    if (post.category === 'PARTNERSHIP') {
      if (!userId) return false;
      if (post.authorId === userId) return true;
      // 관리자 권한 확인 로직 필요 (User 모델 조회)
      return true; // 임시로 true 반환
    }

    // 건의게시판은 작성자와 관리자만 읽기 가능
    if (post.category === 'SUGGESTION') {
      if (!userId) return false;
      if (post.authorId === userId) return true;
      // 관리자 권한 확인 로직 필요
      return true; // 임시로 true 반환
    }

    return false;
  }

  /**
   * 수정 권한 체크
   */
  private async checkUpdatePermission(post: any, userId?: string): Promise<boolean> {
    if (!userId) return false;

    // 공지사항은 관리자만 수정 가능
    if (post.category === 'NOTICE') {
      // 관리자 권한 확인 로직 필요
      return true; // 임시로 true 반환
    }

    // 건의게시판과 제휴문의는 작성자만 수정 가능
    if (post.category === 'SUGGESTION' || post.category === 'PARTNERSHIP') {
      return post.authorId === userId;
    }

    return false;
  }

  /**
   * 삭제 권한 체크
   */
  private async checkDeletePermission(post: any, userId?: string): Promise<boolean> {
    return this.checkUpdatePermission(post, userId);
  }
} 