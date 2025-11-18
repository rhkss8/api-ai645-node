/**
 * 포포춘 운세 세션 엔티티
 */
import { FortuneCategory, SessionMode, FormType } from '../types/fortune';

export class FortuneSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly category: FortuneCategory,
    public readonly mode: SessionMode,
    public readonly remainingTime: number,  // 남은 시간 (초)
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public readonly formType?: FormType,     // ASK, DAILY, TRADITIONAL
    public readonly userInput?: string,      // 세션 생성 시 사용자 입력
    public readonly userData?: Record<string, any>, // 구조화된 운세 데이터
  ) {}

  static create(
    id: string,
    userId: string,
    category: FortuneCategory,
    mode: SessionMode,
    timeInSeconds: number,
    formType?: FormType,
    userInput?: string,
    userData?: Record<string, any>,
  ): FortuneSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + timeInSeconds * 1000);

    return new FortuneSession(
      id,
      userId,
      category,
      mode,
      timeInSeconds,
      true,
      now,
      expiresAt,
      formType,
      userInput,
      userData,
    );
  }

  /**
   * 시간 추가 (결제 후 누적)
   */
  addTime(seconds: number): FortuneSession {
    const newRemainingTime = this.remainingTime + seconds;
    const newExpiresAt = new Date(Date.now() + newRemainingTime * 1000);

    return new FortuneSession(
      this.id,
      this.userId,
      this.category,
      this.mode,
      newRemainingTime,
      this.isActive,
      this.createdAt,
      newExpiresAt,
      this.formType,
      this.userInput,
      this.userData,
    );
  }

  /**
   * 시간 소비
   */
  consumeTime(seconds: number): FortuneSession {
    const newRemainingTime = Math.max(0, this.remainingTime - seconds);
    const isActive = newRemainingTime > 0;
    const newExpiresAt = isActive 
      ? new Date(Date.now() + newRemainingTime * 1000)
      : new Date();

    return new FortuneSession(
      this.id,
      this.userId,
      this.category,
      this.mode,
      newRemainingTime,
      isActive,
      this.createdAt,
      newExpiresAt,
      this.formType,
      this.userInput,
      this.userData,
    );
  }

  /**
   * 세션 종료
   */
  close(): FortuneSession {
    return new FortuneSession(
      this.id,
      this.userId,
      this.category,
      this.mode,
      0,
      false,
      this.createdAt,
      new Date(),
      this.formType,
      this.userInput,
      this.userData,
    );
  }

  /**
   * 결제 연장 필요 여부 (30초 이하)
   */
  needsPaymentPrompt(): boolean {
    return this.remainingTime <= 30 && this.isActive;
  }

  /**
   * 유효성 검증
   */
  validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('세션 ID는 필수입니다.');
    }
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('사용자 ID는 필수입니다.');
    }
    if (this.remainingTime < 0) {
      throw new Error('남은 시간은 0 이상이어야 합니다.');
    }
  }
}
