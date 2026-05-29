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
    public readonly remainingTime: number, // 남은 시간 (초) — 분 단위 상품. 일 단위 이용권은 만료까지 초로 둘 수 있음
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public readonly formType?: FormType,
    public readonly userInput?: string,
    public readonly userData?: Record<string, any>,
    /** 설정 시: 달력 기준 채팅 이용권 만료. 이 모드에서는 턴당 consumeTime으로 세션을 끊지 않음 */
    public readonly chatEntitlementExpiresAt?: Date | null,
  ) {}

  /** 분 단위 채팅 상품 (기존) */
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
      null,
    );
  }

  /**
   * 일 단위 채팅 이용권 (1일/7일/30일 등). 만료는 chatEntitlementExpiresAt 기준.
   */
  static createWithChatEntitlement(
    id: string,
    userId: string,
    category: FortuneCategory,
    mode: SessionMode,
    entitlementUntil: Date,
    formType?: FormType,
    userInput?: string,
    userData?: Record<string, any>,
  ): FortuneSession {
    const now = new Date();
    const remainingSeconds = Math.max(
      0,
      Math.floor((entitlementUntil.getTime() - now.getTime()) / 1000),
    );
    return new FortuneSession(
      id,
      userId,
      category,
      mode,
      remainingSeconds,
      true,
      now,
      entitlementUntil,
      formType,
      userInput,
      userData,
      entitlementUntil,
    );
  }

  isChatEntitlementSession(): boolean {
    return this.chatEntitlementExpiresAt != null;
  }

  /**
   * 시간 추가 (결제 후 누적)
   */
  addTime(seconds: number): FortuneSession {
    if (this.isChatEntitlementSession()) {
      const end = new Date(this.chatEntitlementExpiresAt!.getTime() + seconds * 1000);
      const remainingSeconds = Math.max(
        0,
        Math.floor((end.getTime() - Date.now()) / 1000),
      );
      return new FortuneSession(
        this.id,
        this.userId,
        this.category,
        this.mode,
        remainingSeconds,
        this.isActive,
        this.createdAt,
        end,
        this.formType,
        this.userInput,
        this.userData,
        end,
      );
    }
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
      null,
    );
  }

  /**
   * 시간 소비 (분 단위 상품만 — 이용권 세션에서는 호출하지 말 것)
   */
  consumeTime(seconds: number): FortuneSession {
    if (this.isChatEntitlementSession()) {
      return this;
    }
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
      null,
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
      this.chatEntitlementExpiresAt ?? null,
    );
  }

  /**
   * 결제 연장 필요 여부 (30초 이하)
   */
  needsPaymentPrompt(): boolean {
    if (this.chatEntitlementExpiresAt) {
      const sec = Math.floor(
        (this.chatEntitlementExpiresAt.getTime() - Date.now()) / 1000,
      );
      return sec > 0 && sec <= 30 && this.isActive;
    }
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
