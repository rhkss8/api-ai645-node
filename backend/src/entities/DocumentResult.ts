/**
 * 포포춘 문서 결과 엔티티
 */
import { FortuneCategory } from '../types/fortune';

export class DocumentResult {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly category: FortuneCategory,
    public readonly title: string,
    public readonly content: string,
    public readonly issuedAt: Date,
    public readonly expiresAt: Date,
    public readonly documentLink?: string,
  ) {}

  static create(
    id: string,
    userId: string,
    category: FortuneCategory,
    title: string,
    content: string,
    expiresInDays: number = 30,  // 기본 30일 유효
    documentLink?: string,
  ): DocumentResult {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    return new DocumentResult(
      id,
      userId,
      category,
      title,
      content,
      now,
      expiresAt,
      documentLink,
    );
  }

  /**
   * 문서 만료 여부
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * 유효성 검증
   */
  validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('문서 ID는 필수입니다.');
    }
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('사용자 ID는 필수입니다.');
    }
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('제목은 필수입니다.');
    }
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('내용은 필수입니다.');
    }
    if (this.title.length > 200) {
      throw new Error('제목은 200자 이하여야 합니다.');
    }
  }
}
