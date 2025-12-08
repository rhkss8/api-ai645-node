/**
 * 운세 세션 리포지토리 인터페이스
 */
import { FortuneSession } from '../entities/FortuneSession';
import { FortuneCategory, SessionMode } from '../types/fortune';

export interface IFortuneSessionRepository {
  create(session: FortuneSession): Promise<FortuneSession>;
  findById(id: string): Promise<FortuneSession | null>;
  findByUserId(userId: string, isActive?: boolean): Promise<FortuneSession[]>;
  update(session: FortuneSession): Promise<FortuneSession>;
  closeSession(id: string): Promise<void>;
  findActiveByUserIdAndCategory(
    userId: string,
    category: FortuneCategory,
  ): Promise<FortuneSession | null>;
  findExpiredActiveSessions(): Promise<FortuneSession[]>;
}
