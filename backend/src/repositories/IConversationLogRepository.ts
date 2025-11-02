/**
 * 대화 로그 리포지토리 인터페이스
 */
import { ConversationLog } from '../entities/ConversationLog';

export interface IConversationLogRepository {
  create(log: ConversationLog): Promise<ConversationLog>;
  findBySessionId(sessionId: string): Promise<ConversationLog[]>;
  findById(id: string): Promise<ConversationLog | null>;
}
