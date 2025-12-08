/**
 * AI 서비스 인터페이스
 * 다양한 AI 모델(OpenAI, Claude, Gemini 등)을 교체 가능하도록 설계
 */
import { ChatResponse, DocumentResponse } from '../types/fortune';
import { FortuneCategory } from '../types/fortune';

export interface AIGenerateChatParams {
  category: FortuneCategory;
  userInput: string;
  previousContext?: string;
  userData?: Record<string, any>; // 구조화된 사용자 데이터 (이름, 생년월일, 성별 등)
}

export interface AIGenerateDocumentParams {
  category: FortuneCategory;
  userInput: string;
  userData?: Record<string, any>; // 구조화된 사용자 데이터
}

/**
 * AI 서비스 인터페이스
 * Strategy Pattern을 사용하여 다양한 AI 모델을 교체 가능하도록 설계
 */
export interface IAIService {
  /**
   * 채팅형 운세 응답 생성
   */
  generateChatResponse(params: AIGenerateChatParams): Promise<ChatResponse>;

  /**
   * 문서형 운세 리포트 생성
   */
  generateDocumentResponse(params: AIGenerateDocumentParams): Promise<DocumentResponse>;

  /**
   * AI 모델 이름 반환 (로깅/디버깅용)
   */
  getModelName(): string;
}

