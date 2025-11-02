/**
 * 세션 시간 연장 UseCase
 */
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';

export class ExtendSessionTimeUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
  ) {}

  async execute(sessionId: string, userId: string, additionalSeconds: number): Promise<any> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('세션을 찾을 수 없습니다.');
    }

    if (session.userId !== userId) {
      throw new Error('권한이 없습니다.');
    }

    if (!session.isActive) {
      throw new Error('세션이 종료되었습니다.');
    }

    // 시간 추가
    const extendedSession = session.addTime(additionalSeconds);
    const updated = await this.sessionRepository.update(extendedSession);

    return {
      sessionId: updated.id,
      remainingTime: updated.remainingTime,
      expiresAt: updated.expiresAt.toISOString(),
    };
  }
}
