/**
 * 문서형 운세 UseCase
 */
import { DocumentResult } from '../entities/DocumentResult';
import { IDocumentResultRepository } from '../repositories/IDocumentResultRepository';
import { FortuneGPTService } from '../services/FortuneGPTService';
import { IdGenerator } from '../utils/idGenerator';
import { DocumentResponse, FortuneCategory, getDocumentExpirationDays } from '../types/fortune';
import { AIServiceFactory, AIServiceType } from '../services/ai/AIServiceFactory';

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
    let documentResponse: DocumentResponse;
    let lastError: Error | null = null;

    // 1차 시도: 기본 AI 서비스 (Gemini 또는 OpenAI)
    try {
      documentResponse = await this.gptService.generateDocumentResponse(
        category,
        userInput,
        userData,
      );
    } catch (error: any) {
      console.error('[문서 생성] 기본 AI 서비스 실패:', error);
      lastError = error;

      // Gemini 실패 시 OpenAI로 자동 전환 시도
      const geminiApiKey = process.env.GEMINI_API_KEY;
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      if (geminiApiKey && openaiApiKey) {
        console.log('[문서 생성] OpenAI로 자동 전환 시도');
        try {
          // OpenAI 서비스 직접 생성
          const openAIService = AIServiceFactory.create(
            AIServiceType.OPENAI,
            openaiApiKey,
            process.env.OPENAI_MODEL || 'gpt-4o',
          );
          
          documentResponse = await openAIService.generateDocumentResponse({
            category,
            userInput,
            userData,
          });
          
          console.log('[문서 생성] OpenAI로 성공적으로 생성됨');
        } catch (openaiError: any) {
          console.error('[문서 생성] OpenAI도 실패:', openaiError);
          lastError = openaiError;
          // 두 서비스 모두 실패한 경우 에러를 다시 throw
          throw new Error(
            `운세 리포트 생성에 실패했습니다. ${lastError?.message || '알 수 없는 오류가 발생했습니다.'}`
          );
        }
      } else {
        // OpenAI API 키가 없으면 원래 에러를 그대로 throw
        throw new Error(
          `운세 리포트 생성에 실패했습니다. ${lastError?.message || '알 수 없는 오류가 발생했습니다.'}`
        );
      }
    }

    // 문서 저장
    const documentId = IdGenerator.generateDocumentResultId();
    const expirationDays = getDocumentExpirationDays(category); // 카테고리별 유효기간
    const document = DocumentResult.create(
      documentId,
      userId,
      category,
      documentResponse.title,
      JSON.stringify(documentResponse),
      expirationDays,
    );

    document.validate();

    await this.documentRepository.create(document);

    // 문서 링크는 사용처에서 구성 (응답 타입 최소화)

    return { documentResponse, documentId };
  }
}
