/**
 * 문서형 운세 UseCase
 */
import { DocumentResult } from '../entities/DocumentResult';
import { IDocumentResultRepository } from '../repositories/IDocumentResultRepository';
import { FortuneGPTService } from '../services/FortuneGPTService';
import { IdGenerator } from '../utils/idGenerator';
import { DocumentResponse, FortuneCategory } from '../types/fortune';

export class DocumentFortuneUseCase {
  constructor(
    private readonly documentRepository: IDocumentResultRepository,
    private readonly gptService: FortuneGPTService,
  ) {}

  async execute(
    userId: string,
    category: FortuneCategory,
    userInput: string,
  ): Promise<DocumentResponse> {
    // GPT로 리포트 생성
    const documentResponse = await this.gptService.generateDocumentResponse(
      category,
      userInput,
    );

    // 문서 저장
    const documentId = IdGenerator.generateDocumentResultId();
    const document = DocumentResult.create(
      documentId,
      userId,
      category,
      documentResponse.title,
      JSON.stringify(documentResponse),
      30, // 30일 유효
    );

    document.validate();

    await this.documentRepository.create(document);

    // documentLink 설정 (절대 URL 또는 상대 경로)
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3350';
    documentResponse.documentLink = `${baseUrl}/api/fortune/document/${documentId}`;

    return documentResponse;
  }
}
