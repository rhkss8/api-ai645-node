/**
 * 세션 조회 UseCase
 */
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';

export class GetSessionUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
  ) {}

  async execute(sessionId: string, userId: string): Promise<any> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('세션을 찾을 수 없습니다.');
    }

    if (session.userId !== userId) {
      throw new Error('권한이 없습니다.');
    }

    return {
      sessionId: session.id,
      category: session.category,
      mode: session.mode,
      remainingTime: session.remainingTime,
      isActive: session.isActive,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    };
  }
}
