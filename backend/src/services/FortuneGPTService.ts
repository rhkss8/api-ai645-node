/**
 * 포포춘 운세 GPT 서비스 (레거시 호환)
 * @deprecated IAIService를 직접 사용하세요
 */
import { ChatResponse, DocumentResponse } from '../types/fortune';
import { FortuneCategory } from '../types/fortune';
import { IAIService } from '../interfaces/IAIService';
import { AIServiceFactory, AIServiceType } from './ai/AIServiceFactory';

/**
 * AI 서비스 우선순위 설정
 * 'GEMINI' 또는 'OPENAI' 중 하나를 선택하세요.
 * Gemini를 사용하려면 GEMINI_API_KEY 환경변수가 설정되어 있어야 합니다.
 */
const AI_SERVICE_PRIORITY: 'GEMINI' | 'OPENAI' = 'GEMINI';

/**
 * Gemini 모델 이름 설정
 * 기본값: gemini-2.5-flash (할당량 초과 시 flash 모델 사용)
 * 필요에 따라 이 값을 수정하세요.
 * 사용 가능한 모델: 'gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash' 등
 * Google AI Studio에서 사용 가능한 모델을 확인하세요: https://aistudio.google.com/
 * 
 * 참고: gemini-2.5-pro는 무료 티어 할당량이 제한적이므로, 할당량 초과 시 gemini-2.5-flash 사용 권장
 */
const GEMINI_MODEL_NAME = 'gemini-2.5-flash';

export class FortuneGPTService {
  private aiService: IAIService;

  constructor(apiKey?: string) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    // 우선순위에 따라 AI 서비스 선택
    if (AI_SERVICE_PRIORITY === 'GEMINI' && geminiApiKey) {
      console.log('🤖 Gemini AI 서비스를 사용합니다.');
      this.aiService = AIServiceFactory.create(
        AIServiceType.GEMINI,
        geminiApiKey,
        GEMINI_MODEL_NAME,
      );
    } else {
      if (AI_SERVICE_PRIORITY === 'GEMINI' && !geminiApiKey) {
        console.log('⚠️ AI_SERVICE_PRIORITY가 GEMINI로 설정되어 있지만 GEMINI_API_KEY가 없습니다. OpenAI를 사용합니다.');
      }
      console.log('🤖 OpenAI GPT 서비스를 사용합니다.');
      this.aiService = AIServiceFactory.create(
        AIServiceType.OPENAI,
        apiKey,
        process.env.OPENAI_MODEL || 'gpt-4o',
      );
    }
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
