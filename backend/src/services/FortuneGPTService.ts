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
  private readonly primaryType: AIServiceType;
  private readonly primaryModelName?: string;

  constructor(apiKey?: string) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    // 우선순위에 따라 AI 서비스 선택
    if (AI_SERVICE_PRIORITY === 'GEMINI' && geminiApiKey) {
      console.log('🤖 Gemini AI 서비스를 사용합니다.');
      this.primaryType = AIServiceType.GEMINI;
      this.primaryModelName = GEMINI_MODEL_NAME;
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
      this.primaryType = AIServiceType.OPENAI;
      this.primaryModelName = process.env.OPENAI_MODEL || 'gpt-4o';
      this.aiService = AIServiceFactory.create(
        AIServiceType.OPENAI,
        apiKey,
        process.env.OPENAI_MODEL || 'gpt-4o',
      );
    }
  }

  /**
   * 결제/플랜 쿼터 소진 등 재시도로 해결되지 않는 오류는 즉시 실패(응답 지연 방지).
   */
  private isRetryableAIError(error: any): boolean {
    const inner = error?.cause ?? error;
    const code = inner?.code ?? inner?.error?.code ?? error?.error?.code;
    const type = inner?.type ?? inner?.error?.type;
    if (code === 'insufficient_quota' || type === 'insufficient_quota') {
      return false;
    }
    const status = Number(error?.status ?? error?.cause?.status ?? inner?.status);
    if (status === 429) {
      const msg = String(error?.message || error?.cause?.message || '').toLowerCase();
      if (
        msg.includes('billing') ||
        msg.includes('plan and billing') ||
        msg.includes('insufficient_quota') ||
        msg.includes('exceeded your current quota')
      ) {
        return false;
      }
    }
    if ([500, 502, 503, 504].includes(status)) return true;
    const msg = String(error?.message || error?.cause?.message || '').toLowerCase();
    return (
      msg.includes('overloaded') ||
      msg.includes('service unavailable') ||
      msg.includes('timeout') ||
      msg.includes('temporarily') ||
      msg.includes('잠시') ||
      msg.includes('high demand')
    );
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    opts: { maxAttempts: number; baseDelayMs: number },
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (e: any) {
        lastError = e;
        if (!this.isRetryableAIError(e) || attempt === opts.maxAttempts) break;
        const jitter = Math.floor(Math.random() * 150);
        const delay = opts.baseDelayMs * Math.pow(2, attempt - 1) + jitter;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
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
    const params = { category, userInput, previousContext, userData };

    // 1) primary: 과부하(503 등)만 짧게 1회 재시도 — 실패 시 빠르게 폴백/에러
    try {
      return await this.retryWithBackoff(
        () => this.aiService.generateChatResponse(params),
        { maxAttempts: 2, baseDelayMs: 200 },
      );
    } catch (primaryError: any) {
      console.error('[채팅 생성] 기본 AI 서비스 실패:', {
        primaryType: this.primaryType,
        status: primaryError?.status || primaryError?.cause?.status,
        message: primaryError?.message,
      });

      // 2) Gemini → OpenAI fallback (키가 있을 때만)
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (this.primaryType === AIServiceType.GEMINI && openaiApiKey) {
        try {
          console.log('[채팅 생성] OpenAI로 자동 전환 시도');
          const openAIService = AIServiceFactory.create(
            AIServiceType.OPENAI,
            openaiApiKey,
            process.env.OPENAI_MODEL || 'gpt-4o',
          );
          return await this.retryWithBackoff(
            () => openAIService.generateChatResponse(params),
            { maxAttempts: 1, baseDelayMs: 200 },
          );
        } catch (fallbackError: any) {
          console.error('[채팅 생성] OpenAI도 실패:', {
            status: fallbackError?.status || fallbackError?.cause?.status,
            message: fallbackError?.message,
          });
          throw fallbackError;
        }
      }

      throw primaryError;
    }
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
