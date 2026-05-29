/**
 * OpenAI GPT 서비스 구현
 */
import OpenAI from 'openai';
import { IAIService, AIGenerateChatParams, AIGenerateDocumentParams } from '../../interfaces/IAIService';
import { ChatResponse, DocumentResponse } from '../../types/fortune';
import { generateChatFortunePrompt } from '../../prompts/chatFortunePrompt';
import { generateDocumentFortunePrompt } from '../../prompts/documentFortunePrompt';
import { normalizeChatResponseCopy, normalizeDocumentResponseCopy } from '../../utils/normalizeFortuneCopy';

export class OpenAIService implements IAIService {
  private openai: OpenAI;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gpt-4o') {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }
    this.openai = new OpenAI({
      apiKey,
    });
    this.modelName = modelName;
  }

  async generateChatResponse(params: AIGenerateChatParams): Promise<ChatResponse> {
    try {
      const prompt = generateChatFortunePrompt({
        category: params.category,
        userInput: params.userInput,
        previousContext: params.previousContext,
        userData: params.userData,
        hasImageInput: Boolean(params.image),
      });

      const completion = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: `당신은 전문 운세 상담사입니다. 응답은 반드시 JSON만 출력하며, 허용되는 키는 "message"(한 덩어리 이야기)와 "nextQuestions"(배열) 두 개뿐입니다. summary, points, tips, disclaimer 등 다른 키는 사용하지 마세요.`,
          },
          {
            role: 'user',
            content: params.image
              ? [
                  { type: 'text', text: prompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${params.image.mimeType};base64,${params.image.base64Data}`,
                    },
                  },
                ]
              : prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message.content;
      if (!response) {
        throw new Error('GPT 응답을 받지 못했습니다.');
      }

      const parsed = JSON.parse(response) as ChatResponse;

      // 유효성 검증 (프롬프트 버전에 따라 스키마가 다를 수 있음)
      const anyParsed = parsed as any;

      // V2: { message, nextQuestions? }
      if (anyParsed && typeof anyParsed.message === 'string') {
        if (!Array.isArray(anyParsed.nextQuestions)) {
          anyParsed.nextQuestions = [];
        }
        return normalizeChatResponseCopy(anyParsed as ChatResponse);
      }

      // V1 수신 시 V2로 변환 (프롬프트는 message+nextQuestions만 요구하나, 모델이 구 형식으로 올 경우 한 덩어리로 합침)
      if (
        anyParsed &&
        typeof anyParsed.summary === 'string'
      ) {
        const points = Array.isArray(anyParsed.points) ? anyParsed.points : [];
        const tips = Array.isArray(anyParsed.tips) ? anyParsed.tips : [];
        const extra = [...points, ...tips]
          .map((p: string) => (typeof p === 'string' ? p.replace(/^[-*•]\s*/, '') : ''))
          .filter(Boolean)
          .join(' ');
        const oneBlock = extra ? `${anyParsed.summary}\n\n${extra}` : anyParsed.summary;
        const nextQuestions = Array.isArray(anyParsed.nextQuestions) ? anyParsed.nextQuestions : [];
        return normalizeChatResponseCopy({ message: oneBlock, nextQuestions } as ChatResponse);
      }

      throw new Error('GPT 응답 형식이 올바르지 않습니다. message 또는 summary 필드가 필요합니다.');
    } catch (error) {
      console.error('채팅형 운세 응답 생성 중 오류:', error);
      // 상위 레이어에서 재시도/폴백 판단할 수 있도록 status/cause 보존
      const wrapped: any = new Error('운세 응답 생성에 실패했습니다.');
      wrapped.status = (error as any)?.status;
      wrapped.statusText = (error as any)?.statusText;
      wrapped.cause = error;
      throw wrapped;
    }
  }

  async generateDocumentResponse(params: AIGenerateDocumentParams): Promise<DocumentResponse> {
    try {
      const prompt = generateDocumentFortunePrompt({
        category: params.category,
        userInput: params.userInput,
        userData: params.userData,
      });

      const completion = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: `당신은 전문 운세 분석가입니다. 상세한 운세 리포트를 작성하며, 반드시 JSON 형식으로만 응답해주세요.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message.content;
      if (!response) {
        throw new Error('GPT 응답을 받지 못했습니다.');
      }

      const parsed = JSON.parse(response) as Partial<DocumentResponse>;

      // 유효성 검증
      if (!parsed.title || !parsed.summary || !parsed.content || !parsed.advice || !parsed.warnings) {
        throw new Error('GPT 응답 형식이 올바르지 않습니다.');
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

      return normalizeDocumentResponseCopy(ensured);
    } catch (error) {
      console.error('문서형 운세 리포트 생성 중 오류:', error);
      const source = error as {
        code?: string;
        status?: number;
        message?: string;
      };
      const wrapped = new Error('운세 리포트 생성에 실패했습니다.') as Error & {
        code?: string;
        status?: number;
        cause?: unknown;
      };
      wrapped.code = source.code;
      wrapped.status = source.status;
      wrapped.cause = error;
      throw wrapped;
    }
  }

  getModelName(): string {
    return this.modelName;
  }
}
