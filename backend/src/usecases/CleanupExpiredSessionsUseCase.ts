/**
 * 만료된 세션 정리 및 대화 기록 저장 UseCase
 */
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { IConversationLogRepository } from '../repositories/IConversationLogRepository';

export class CleanupExpiredSessionsUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly logRepository: IConversationLogRepository,
  ) {}

  /**
   * 만료된 세션들을 정리하고 대화 기록을 저장
   */
  async execute(): Promise<{ cleanedCount: number }> {
    // 만료되었지만 아직 활성 상태인 세션들 조회
    const expiredSessions = await this.sessionRepository.findExpiredActiveSessions();

    let cleanedCount = 0;

    for (const session of expiredSessions) {
      // 세션 종료
      await this.sessionRepository.closeSession(session.id);
      
      // 대화 로그는 이미 ConversationLog 테이블에 저장되어 있음
      // 추가 백업이나 집계가 필요하면 여기서 처리
      
      cleanedCount++;
    }

    return { cleanedCount };
  }
}
