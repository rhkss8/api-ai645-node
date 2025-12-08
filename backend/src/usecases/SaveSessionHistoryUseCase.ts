/**
 * 세션 만료 시 대화 기록 저장 UseCase
 */
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { IConversationLogRepository } from '../repositories/IConversationLogRepository';

export class SaveSessionHistoryUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly logRepository: IConversationLogRepository,
  ) {}

  async execute(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('세션을 찾을 수 없습니다.');
    }

    // 이미 저장된 세션이면 스킵
    if (!session.isActive) {
      return;
    }

    // 만료된 세션인지 확인
    if (session.expiresAt > new Date()) {
      return; // 아직 만료되지 않음
    }

    // 대화 로그 조회
    const logs = await this.logRepository.findBySessionId(sessionId);

    // 세션 종료 처리
    await this.sessionRepository.closeSession(sessionId);

    // TODO: 필요시 대화 기록을 별도 테이블에 저장하거나 백업할 수 있음
    // 현재는 ConversationLog 테이블에 이미 저장되어 있으므로 추가 작업 불필요
  }
}
