/**
 * 포포춘 운세 GPT 서비스 (레거시 호환)
 * @deprecated IAIService를 직접 사용하세요
 */
import { ChatResponse, DocumentResponse } from '../types/fortune';
import { FortuneCategory } from '../types/fortune';
import { IAIService } from '../interfaces/IAIService';
import { AIServiceFactory, AIServiceType } from './ai/AIServiceFactory';

export class FortuneGPTService {
  private aiService: IAIService;

  constructor(apiKey?: string) {
    // 기본적으로 OpenAI 사용
    this.aiService = AIServiceFactory.create(
      AIServiceType.OPENAI,
      apiKey,
      process.env.OPENAI_MODEL || 'gpt-4o',
    );
  }

  /**
   * 채팅형 운세 응답 생성
   */
  async generateChatResponse(
    category: FortuneCategory,
    userInput: string,
    previousContext?: string,
    userData?: Record<string, any>,
  ): Promise<ChatResponse> {
    return this.aiService.generateChatResponse({
      category,
      userInput,
      previousContext,
      userData,
    });
  }

  /**
   * 문서형 운세 리포트 생성
   */
  async generateDocumentResponse(
    category: FortuneCategory,
    userInput: string,
    userData?: Record<string, any>,
  ): Promise<DocumentResponse> {
    return this.aiService.generateDocumentResponse({
      category,
      userInput,
      userData,
    });
  }

  /**
   * AI 서비스 인스턴스 반환 (고급 사용)
   */
  getAIService(): IAIService {
    return this.aiService;
  }
}
