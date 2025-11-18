/**
 * AI 서비스 팩토리
 * 환경변수나 설정에 따라 적절한 AI 서비스를 생성
 */
import { IAIService } from '../../interfaces/IAIService';
import { OpenAIService } from './OpenAIService';

export enum AIServiceType {
  OPENAI = 'openai',
  // 향후 추가 가능: CLAUDE = 'claude', GEMINI = 'gemini', etc.
}

export class AIServiceFactory {
  /**
   * AI 서비스 인스턴스 생성
   * @param type - AI 서비스 타입 (기본값: OPENAI)
   * @param apiKey - API 키 (환경변수에서 가져옴)
   * @param modelName - 모델 이름 (기본값: gpt-4o)
   */
  static create(
    type: AIServiceType = AIServiceType.OPENAI,
    apiKey?: string,
    modelName?: string,
  ): IAIService {
    switch (type) {
      case AIServiceType.OPENAI:
        return new OpenAIService(apiKey, modelName);
      // 향후 다른 AI 서비스 추가 가능
      // case AIServiceType.CLAUDE:
      //   return new ClaudeService(apiKey, modelName);
      // case AIServiceType.GEMINI:
      //   return new GeminiService(apiKey, modelName);
      default:
        throw new Error(`지원하지 않는 AI 서비스 타입입니다: ${type}`);
    }
  }
}

