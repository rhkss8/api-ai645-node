/**
 * Google Gemini 서비스 구현
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIService, AIGenerateChatParams, AIGenerateDocumentParams } from '../../interfaces/IAIService';
import { ChatResponse, DocumentResponse } from '../../types/fortune';
import { generateChatFortunePrompt } from '../../prompts/chatFortunePrompt';
import { generateDocumentFortunePrompt } from '../../prompts/documentFortunePrompt';

export class GeminiService implements IAIService {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  /**
   * Gemini 모델 이름 설정
   * 사용 가능한 모델: 'gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash' 등
   * Google AI Studio에서 사용 가능한 모델을 확인하세요: https://aistudio.google.com/
   * 
   * 참고: gemini-2.5-pro는 무료 티어 할당량이 제한적이므로, 할당량 초과 시 gemini-2.5-flash 사용 권장
   */
  private static readonly DEFAULT_MODEL_NAME = 'gemini-2.5-flash';

  constructor(apiKey?: string, modelName: string = GeminiService.DEFAULT_MODEL_NAME) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateChatResponse(params: AIGenerateChatParams): Promise<ChatResponse> {
    try {
      const prompt = generateChatFortunePrompt({
        category: params.category,
        userInput: params.userInput,
        previousContext: params.previousContext,
        userData: params.userData,
      });

      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 10000,
          // responseMimeType: 'application/json', // 일부 모델에서 지원하지 않을 수 있음
        },
      });

      const systemInstruction = '당신은 전문 사주 상담사입니다. 사용자의 질문에 대해 친근하고 상세하게 답변하며, 반드시 JSON 형식으로만 응답해주세요. "AI", "인공지능" 등의 표현을 사용하지 말고, 사주 전문가로서 자연스럽게 작성하세요.';
      const fullPrompt = `${systemInstruction}\n\n${prompt}\n\n중요: 반드시 JSON 형식으로만 응답해주세요. 다른 설명 없이 JSON만 반환해주세요.`;

      const result = await model.generateContent(fullPrompt);

      // 응답 확인 및 에러 처리
      if (!result || !result.response) {
        console.error('Gemini 응답 객체가 없습니다:', { result });
        throw new Error('Gemini 응답을 받지 못했습니다.');
      }

      // finishReason 확인
      const finishReason = result.response.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ Gemini 응답이 토큰 제한으로 잘렸습니다. maxOutputTokens를 늘려주세요.');
      }

      // 응답 텍스트 추출 (여러 방법 시도)
      let response = result.response.text();
      
      // text()가 비어있으면 candidates에서 직접 추출 시도
      if (!response || response.trim().length === 0) {
        const candidate = result.response.candidates?.[0];
        if (candidate?.content?.parts) {
          response = candidate.content.parts
            .map((part: any) => part.text || '')
            .join('');
        }
      }

      if (!response || response.trim().length === 0) {
        console.error('Gemini 응답이 비어있습니다:', {
          response,
          finishReason,
          candidates: result.response.candidates,
          promptLength: fullPrompt.length,
        });
        throw new Error('Gemini 응답이 비어있습니다.');
      }

      // JSON 파싱 (마크다운 코드 블록 제거)
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedResponse) as ChatResponse;

      // 유효성 검증
      if (!parsed.summary || !parsed.points || !parsed.tips || !parsed.disclaimer) {
        throw new Error('Gemini 응답 형식이 올바르지 않습니다.');
      }

      return parsed;
    } catch (error) {
      console.error('채팅형 운세 응답 생성 중 오류:', error);
      throw new Error('운세 응답 생성에 실패했습니다.');
    }
  }

  async generateDocumentResponse(params: AIGenerateDocumentParams): Promise<DocumentResponse> {
    try {
      const prompt = generateDocumentFortunePrompt({
        category: params.category,
        userInput: params.userInput,
        userData: params.userData,
      });

      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 10000, // 문서형은 최대 10000 토큰까지 사용 가능
          // responseMimeType: 'application/json', // 일부 모델에서 지원하지 않을 수 있음
        },
      });

      const systemInstruction = '당신은 전문 사주 분석가입니다. 상세하고 자세한 운세 리포트를 작성하며, 반드시 JSON 형식으로만 응답해주세요. 최대한 상세하고 풍부한 내용으로 작성해주세요. "AI", "인공지능" 등의 표현을 사용하지 말고, 사주 전문가로서 자연스럽게 작성하세요.';
      const fullPrompt = `${systemInstruction}\n\n${prompt}\n\n중요: 
1. 반드시 JSON 형식으로만 응답해주세요. 다른 설명 없이 JSON만 반환해주세요.
2. 최대한 상세하고 풍부한 내용으로 작성해주세요. 가능한 한 많은 정보를 포함해주세요.
3. 본문(content)은 최소 1000자 이상, 가능하면 2000자 이상으로 상세하게 작성해주세요.
4. 조언(advice)과 주의사항(warnings)도 구체적이고 실용적으로 작성해주세요.`;

      const result = await model.generateContent(fullPrompt);

      // 응답 확인 및 에러 처리
      if (!result || !result.response) {
        console.error('Gemini 응답 객체가 없습니다:', { result });
        throw new Error('Gemini 응답을 받지 못했습니다.');
      }

      // finishReason 확인
      const finishReason = result.response.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ Gemini 응답이 토큰 제한으로 잘렸습니다. maxOutputTokens를 늘려주세요.');
      }

      // 응답 텍스트 추출 (여러 방법 시도)
      let response = result.response.text();
      
      // text()가 비어있으면 candidates에서 직접 추출 시도
      if (!response || response.trim().length === 0) {
        const candidate = result.response.candidates?.[0];
        if (candidate?.content?.parts) {
          response = candidate.content.parts
            .map((part: any) => part.text || '')
            .join('');
        }
      }

      if (!response || response.trim().length === 0) {
        console.error('Gemini 응답이 비어있습니다:', {
          response,
          finishReason,
          candidates: result.response.candidates,
          promptLength: fullPrompt.length,
        });
        throw new Error('Gemini 응답이 비어있습니다.');
      }

      // JSON 파싱 (마크다운 코드 블록 제거)
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // MAX_TOKENS로 잘렸을 경우, 불완전한 JSON을 복구 시도
      if (finishReason === 'MAX_TOKENS') {
        // 마지막 불완전한 JSON 객체를 닫기 시도
        if (!cleanedResponse.endsWith('}')) {
          // 마지막 불완전한 문자열이나 배열을 닫기
          const lastBraceIndex = cleanedResponse.lastIndexOf('}');
          const lastBracketIndex = cleanedResponse.lastIndexOf(']');
          const lastQuoteIndex = cleanedResponse.lastIndexOf('"');
          
          if (lastBraceIndex > 0) {
            // 가장 마지막 닫는 중괄호 이후의 불완전한 부분 제거
            cleanedResponse = cleanedResponse.substring(0, lastBraceIndex + 1);
          } else if (lastBracketIndex > 0) {
            // 배열이 열려있으면 닫기
            cleanedResponse = cleanedResponse.substring(0, lastBracketIndex + 1) + '}';
          } else if (lastQuoteIndex > 0) {
            // 문자열이 열려있으면 닫기
            const beforeQuote = cleanedResponse.substring(0, lastQuoteIndex + 1);
            cleanedResponse = beforeQuote + '"';
          }
        }
      }

      let parsed: Partial<DocumentResponse>;
      try {
        parsed = JSON.parse(cleanedResponse) as Partial<DocumentResponse>;
      } catch (parseError: any) {
        console.error('JSON 파싱 실패:', {
          error: parseError.message,
          finishReason,
          responseLength: cleanedResponse.length,
          responsePreview: cleanedResponse.substring(0, 500),
        });
        
        // MAX_TOKENS로 잘렸을 경우 더 자세한 에러 메시지
        if (finishReason === 'MAX_TOKENS') {
          throw new Error('응답이 토큰 제한으로 잘려서 완전한 JSON을 생성하지 못했습니다. maxOutputTokens를 더 늘려주세요.');
        }
        
        throw new Error(`JSON 파싱 실패: ${parseError.message}`);
      }

      // 유효성 검증
      if (!parsed.title || !parsed.summary || !parsed.content || !parsed.advice || !parsed.warnings) {
        throw new Error('Gemini 응답 형식이 올바르지 않습니다.');
      }

      // chatPrompt가 없으면 기본값 설정
      const chatPrompt = parsed.chatPrompt ?? '더 자세한 상담을 원하시나요? 홍시를 사용해 채팅으로 이어보세요!';

      // 날짜 설정 (Asia/Seoul 기준)
      const now = new Date();
      const seoulTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      const date = seoulTime.toISOString().split('T')[0] as string;

      const ensured: DocumentResponse = {
        title: parsed.title as string,
        date,
        summary: parsed.summary as string,
        content: parsed.content as string,
        advice: parsed.advice as string[],
        warnings: parsed.warnings as string[],
        chatPrompt,
      };

      return ensured;
    } catch (error) {
      console.error('문서형 운세 리포트 생성 중 오류:', error);
      throw new Error('운세 리포트 생성에 실패했습니다.');
    }
  }

  getModelName(): string {
    return this.modelName;
  }
}

