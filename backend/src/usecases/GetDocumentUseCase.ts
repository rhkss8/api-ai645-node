/**
 * 문서 조회 UseCase
 */
import { IDocumentResultRepository } from '../repositories/IDocumentResultRepository';

export class GetDocumentUseCase {
  constructor(
    private readonly documentRepository: IDocumentResultRepository,
  ) {}

  async execute(documentId: string, userId: string): Promise<any> {
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new Error('문서를 찾을 수 없습니다.');
    }

    if (document.userId !== userId) {
      throw new Error('권한이 없습니다.');
    }

    if (document.isExpired()) {
      throw new Error('문서가 만료되었습니다.');
    }

    const content = JSON.parse(document.content);

    return {
      documentId: document.id,
      category: document.category,
      title: content.title,
      date: content.date,
      summary: content.summary,
      content: content.content,
      advice: content.advice,
      warnings: content.warnings,
      chatPrompt: content.chatPrompt,
      documentLink: document.documentLink,
      issuedAt: document.issuedAt.toISOString(),
      expiresAt: document.expiresAt.toISOString(),
    };
  }
}
