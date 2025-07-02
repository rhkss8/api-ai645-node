import OpenAI from 'openai';
import {
  LotteryNumberSets,
  UserConditions,
  ImageExtractResult,
  GPTModel,
  WinningNumbers,
  UploadedFile,
} from '../../types/common';
import { IGPTService, GPTRecommendationResult } from '../IGPTService';
import { generateFreeRecommendationPrompt } from '../../prompts/freeRecommendationPrompt';
import { generatePremiumRecommendationPrompt } from '../../prompts/premiumRecommendationPrompt';
import { generateImageExtractionPrompt } from '../../prompts/imageExtractionPrompt';
import { generateReviewPrompt } from '../../prompts/reviewPrompt';
import { GPTResponseParser } from '../../utils/gptResponseParser';

export class OpenAIGPTService implements IGPTService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async generateRecommendation(
    model: GPTModel,
    gameCount: number,
    conditions?: UserConditions,
    round?: number,
    imageData?: ImageExtractResult,
    previousReviews?: string[],
  ): Promise<GPTRecommendationResult> {
    try {
      const prompt = model === GPTModel.GPT_4O 
        ? generatePremiumRecommendationPrompt({ gameCount, conditions, round, imageData, previousReviews })
        : generateFreeRecommendationPrompt({ gameCount, conditions, round, imageData, previousReviews });

      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: '당신은 로또 번호 추천 전문가입니다. 요청에 따라 정확히 JSON 형식으로만 응답해주세요.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message.content;
      if (!response) {
        throw new Error('GPT 응답을 받지 못했습니다.');
      }

      console.log(`🤖 추천 GPT 응답 받음: ${response.substring(0, 100)}...`);
      console.log(`🔍 추천 GPT 전체 응답:`, response);

      if (!this.validateResponse(response, gameCount)) {
        throw new Error('GPT 응답 형식이 올바르지 않습니다.');
      }

      return this.parseRecommendationFromResponse(response, gameCount);
    } catch (error) {
      console.error('GPT 추천 생성 중 오류:', error);
      throw new Error('번호 추천 생성에 실패했습니다.');
    }
  }

  async extractNumbersFromImage(image: UploadedFile): Promise<ImageExtractResult> {
    try {
      const prompt = generateImageExtractionPrompt();
      
      // 이미지를 base64로 인코딩
      const base64Image = image.buffer.toString('base64');
      const mimeType = image.mimetype;

      console.log(`🖼️ 이미지 분석 시작: ${image.originalname} (${image.size} bytes, ${mimeType})`);

      const completion = await this.openai.chat.completions.create({
        model: GPTModel.GPT_4O,
        messages: [
          {
            role: 'system',
            content: '당신은 이미지에서 로또 번호를 추출하는 전문가입니다. 정확히 JSON 형식으로만 응답해주세요.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message.content;
      if (!response) {
        throw new Error('GPT API에서 응답을 받지 못했습니다. (응답이 비어있음)');
      }

      console.log(`📝 GPT 응답 받음: ${response.substring(0, 100)}...`);
      console.log(`🔍 GPT 전체 응답:`, response);
      console.log(`🔍 GPT 응답 타입:`, typeof response);
      console.log(`🔍 GPT 응답 길이:`, response.length);

      // 새로운 파서를 사용하여 응답 파싱
      const parsed = GPTResponseParser.parseImageExtractionResponse(response);
      
      console.log(`✅ 이미지 분석 완료: ${parsed.numbers.length}개 유효한 게임 추출`);

      // 유효한 번호가 없는 경우에도 정상 응답 반환
      return {
        numbers: parsed.numbers,
        extractedText: parsed.extractedText || '',
        notes: parsed.notes || (parsed.numbers.length > 0 ? `총 ${parsed.numbers.length}게임 추출됨` : '유효한 로또 번호를 찾을 수 없습니다.'),
      };
    } catch (error) {
      console.error('이미지 번호 추출 중 상세 오류:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        imageName: image.originalname,
        imageSize: image.size,
        imageType: image.mimetype,
      });
      
      if (error instanceof Error) {
        throw new Error(`이미지에서 번호 추출에 실패했습니다: ${error.message}`);
      }
      throw new Error('이미지에서 번호 추출에 실패했습니다.');
    }
  }

  async generateReview(
    recommendedNumbers: LotteryNumberSets,
    winningNumbers: WinningNumbers,
    matchedCounts: number[],
    conditions?: UserConditions,
  ): Promise<string> {
    try {
      const prompt = generateReviewPrompt({
        recommendedNumbers,
        winningNumbers,
        matchedCounts,
        conditions,
      });

      const completion = await this.openai.chat.completions.create({
        model: GPTModel.GPT_4O,
        messages: [
          {
            role: 'system',
            content: '당신은 로또 번호 추천 결과를 분석하는 전문가입니다. 객관적이고 건설적인 회고 분석을 제공해주세요.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      const response = completion.choices[0]?.message.content;
      if (!response) {
        throw new Error('회고 분석 응답을 받지 못했습니다.');
      }

      console.log(`📊 회고 GPT 응답 받음: ${response.substring(0, 100)}...`);
      console.log(`🔍 회고 GPT 전체 응답:`, response);

      return response.trim();
    } catch (error) {
      console.error('회고 분석 생성 중 오류:', error);
      throw new Error('회고 분석 생성에 실패했습니다.');
    }
  }

  validateResponse(response: string, expectedGameCount?: number): boolean {
    try {
      const parsed = GPTResponseParser.parseRecommendationResponse(response, expectedGameCount);
      return true;
    } catch {
      return false;
    }
  }

  parseNumbersFromResponse(response: string, expectedGameCount?: number): LotteryNumberSets {
    try {
      const parsed = GPTResponseParser.parseRecommendationResponse(response, expectedGameCount);
      return parsed.numbers;
    } catch (error) {
      console.error('응답 파싱 중 오류:', error);
      throw new Error('GPT 응답을 파싱할 수 없습니다.');
    }
  }

  parseRecommendationFromResponse(response: string, expectedGameCount?: number): GPTRecommendationResult {
    try {
      const parsed = GPTResponseParser.parseRecommendationResponse(response, expectedGameCount);
      return {
        numbers: parsed.numbers,
        analysis: parsed.analysis,
        strategies: parsed.strategies,
        confidence: parsed.confidence,
      };
    } catch (error) {
      console.error('응답 파싱 중 오류:', error);
      throw new Error('GPT 응답을 파싱할 수 없습니다.');
    }
  }

  // 사용량 추적을 위한 토큰 계산 (근사치)
  private estimateTokens(text: string): number {
    // 한국어는 대략 1.5 characters per token
    return Math.ceil(text.length / 1.5);
  }

  // API 비용 계산 (GPT-4o 기준)
  private calculateCost(inputTokens: number, outputTokens: number, model: GPTModel): number {
    const prices = {
      [GPTModel.GPT_3_5_TURBO]: { input: 0.0015, output: 0.002 }, // per 1K tokens
      [GPTModel.GPT_4O]: { input: 0.03, output: 0.06 }, // per 1K tokens
    };

    const price = prices[model];
    if (!price) return 0;

    return (inputTokens / 1000) * price.input + (outputTokens / 1000) * price.output;
  }
} 