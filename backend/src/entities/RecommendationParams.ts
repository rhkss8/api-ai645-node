import { RecommendationType, UserConditions } from '../types/common';

export enum RecommendationParamStatus {
  PENDING = 'PENDING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED'
}

export class RecommendationParams {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: RecommendationType,
    public readonly gameCount: number,
    public readonly conditions: UserConditions | null,
    public readonly round: number | null,
    public readonly status: RecommendationParamStatus,
    public readonly orderId: string | null,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static create(
    id: string,
    userId: string,
    type: RecommendationType,
    gameCount: number,
    conditions?: UserConditions,
    round?: number,
  ): RecommendationParams {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24시간 후

    return new RecommendationParams(
      id,
      userId,
      type,
      gameCount,
      conditions || null,
      round || null,
      RecommendationParamStatus.PENDING,
      null, // orderId는 나중에 설정
      expiresAt,
      now,
      now,
    );
  }

  public validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('ID는 필수입니다.');
    }

    if (!this.userId || this.userId.trim() === '') {
      throw new Error('사용자 ID는 필수입니다.');
    }

    if (!this.type) {
      throw new Error('추천 타입은 필수입니다.');
    }

    if (this.gameCount < 1 || this.gameCount > 10) {
      throw new Error('게임수는 1-10 사이여야 합니다.');
    }

    if (this.round && (this.round < 1 || this.round > 9999)) {
      throw new Error('회차는 1-9999 사이여야 합니다.');
    }

    if (this.expiresAt < new Date()) {
      throw new Error('이미 만료된 파라미터입니다.');
    }
  }

  public isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  public canGenerateRecommendation(): boolean {
    return this.status === RecommendationParamStatus.PAYMENT_COMPLETED ||
           this.status === RecommendationParamStatus.FAILED; // 실패한 경우 재시도 가능
  }

  public updateStatus(status: RecommendationParamStatus): RecommendationParams {
    return new RecommendationParams(
      this.id,
      this.userId,
      this.type,
      this.gameCount,
      this.conditions,
      this.round,
      status,
      this.orderId,
      this.expiresAt,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  public linkToOrder(orderId: string): RecommendationParams {
    return new RecommendationParams(
      this.id,
      this.userId,
      this.type,
      this.gameCount,
      this.conditions,
      this.round,
      RecommendationParamStatus.PAYMENT_PENDING,
      orderId,
      this.expiresAt,
      this.createdAt,
      new Date(), // updatedAt
    );
  }
} 