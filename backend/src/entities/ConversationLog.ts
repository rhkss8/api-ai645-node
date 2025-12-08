/**
 * 포포춘 대화 로그 엔티티
 */
export class ConversationLog {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly userInput: string,
    public readonly aiOutput: string,
    public readonly elapsedTime: number,  // 소요 시간 (초)
    public readonly isPaid: boolean,       // 유료 사용 여부
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    sessionId: string,
    userInput: string,
    aiOutput: string,
    elapsedTime: number,
    isPaid: boolean,
  ): ConversationLog {
    return new ConversationLog(
      id,
      sessionId,
      userInput,
      aiOutput,
      elapsedTime,
      isPaid,
      new Date(),
    );
  }

  validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('로그 ID는 필수입니다.');
    }
    if (!this.sessionId || this.sessionId.trim().length === 0) {
      throw new Error('세션 ID는 필수입니다.');
    }
    if (!this.userInput || this.userInput.trim().length === 0) {
      throw new Error('사용자 입력은 필수입니다.');
    }
    if (!this.aiOutput || this.aiOutput.trim().length === 0) {
      throw new Error('AI 출력은 필수입니다.');
    }
    if (this.elapsedTime < 0) {
      throw new Error('소요 시간은 0 이상이어야 합니다.');
    }
  }
}
