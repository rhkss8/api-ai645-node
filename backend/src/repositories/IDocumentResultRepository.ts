/**
 * 문서 결과 리포지토리 인터페이스
 */
import { DocumentResult } from '../entities/DocumentResult';
import { DocumentChatBridgeContext, FortuneCategory } from '../types/fortune';

export interface IDocumentResultRepository {
  create(document: DocumentResult): Promise<DocumentResult>;
  findById(id: string): Promise<DocumentResult | null>;
  findByUserId(userId: string, category?: FortuneCategory): Promise<DocumentResult[]>;
  findByUserIdAndCategory(
    userId: string,
    category: FortuneCategory,
  ): Promise<DocumentResult[]>;
  updateChatContext(
    id: string,
    chatContext: DocumentChatBridgeContext,
    version: number,
  ): Promise<DocumentResult>;
  delete(id: string): Promise<void>;
}
