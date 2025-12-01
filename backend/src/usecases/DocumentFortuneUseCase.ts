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
    userData?: Record<string, any>,
  ): Promise<{ documentResponse: DocumentResponse; documentId: string }> {
    // GPT로 리포트 생성
    const documentResponse = await this.gptService.generateDocumentResponse(
      category,
      userInput,
      userData,
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

    // 문서 링크는 사용처에서 구성 (응답 타입 최소화)

    return { documentResponse, documentId };
  }
}
