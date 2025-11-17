/**
 * 포포춘 운세 GPT 서비스
 */
import OpenAI from 'openai';
import { ChatResponse, DocumentResponse } from '../types/fortune';
import { generateChatFortunePrompt } from '../prompts/chatFortunePrompt';
import { generateDocumentFortunePrompt } from '../prompts/documentFortunePrompt';
import { FortuneCategory } from '../types/fortune';

export class FortuneGPTService {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }
    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
   * 채팅형 운세 응답 생성
   */
  async generateChatResponse(
    category: FortuneCategory,
    userInput: string,
    previousContext?: string,
  ): Promise<ChatResponse> {
    try {
      const prompt = generateChatFortunePrompt({
        category,
        userInput,
        previousContext,
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `당신은 전문 운세 상담사입니다. 사용자의 질문에 대해 친근하고 상세하게 답변하며, 반드시 JSON 형식으로만 응답해주세요.`,
          },
          {
            role: 'user',
            content: prompt,
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

      // 유효성 검증
      if (!parsed.summary || !parsed.points || !parsed.tips || !parsed.disclaimer) {
        throw new Error('GPT 응답 형식이 올바르지 않습니다.');
      }

      return parsed;
    } catch (error) {
      console.error('채팅형 운세 응답 생성 중 오류:', error);
      throw new Error('운세 응답 생성에 실패했습니다.');
    }
  }

  /**
   * 문서형 운세 리포트 생성
   */
  async generateDocumentResponse(
    category: FortuneCategory,
    userInput: string,
  ): Promise<DocumentResponse> {
    try {
      const prompt = generateDocumentFortunePrompt({
        category,
        userInput,
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
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

      return ensured;
    } catch (error) {
      console.error('문서형 운세 리포트 생성 중 오류:', error);
      throw new Error('운세 리포트 생성에 실패했습니다.');
    }
  }
}
