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
        : generateFreeRecommendationPrompt({ gameCount, conditions, round, previousReviews });

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

      if (!this.validateResponse(response, gameCount)) {
        throw new Error('GPT 응답 형식이 올바르지 않습니다.');
      }

      return this.parseRecommendationFromResponse(response);
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
        throw new Error('이미지 분석 응답을 받지 못했습니다.');
      }

      const parsed = JSON.parse(response);
      
      // 결과 검증
      if (!parsed.numbers || !Array.isArray(parsed.numbers)) {
        throw new Error('추출된 번호가 올바른 형식이 아닙니다.');
      }

      // 번호 유효성 검증
      const validNumbers = parsed.numbers.filter((num: number) => 
        typeof num === 'number' && num >= 1 && num <= 45
      );

      return {
        numbers: validNumbers.slice(0, 6), // 최대 6개까지만
        confidence: parsed.confidence || 0,
        extractedText: parsed.extractedText || '',
        notes: parsed.notes || '',
      };
    } catch (error) {
      console.error('이미지 번호 추출 중 오류:', error);
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

      return response.trim();
    } catch (error) {
      console.error('회고 분석 생성 중 오류:', error);
      throw new Error('회고 분석 생성에 실패했습니다.');
    }
  }

  validateResponse(response: string, expectedGameCount?: number): boolean {
    try {
      const parsed = JSON.parse(response);
      
      // 기본 구조 확인
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        return false;
      }

      // 게임수 확인 (expectedGameCount가 제공된 경우)
      if (expectedGameCount && parsed.recommendations.length !== expectedGameCount) {
        return false;
      }

      // 각 세트가 6개 번호를 가지는지 확인
      for (const set of parsed.recommendations) {
        if (!Array.isArray(set) || set.length !== 6) {
          return false;
        }
        
        // 각 번호가 1-45 범위인지 확인
        for (const num of set) {
          if (typeof num !== 'number' || num < 1 || num > 45) {
            return false;
          }
        }
        
        // 중복 번호 확인
        const uniqueNumbers = new Set(set);
        if (uniqueNumbers.size !== 6) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  parseNumbersFromResponse(response: string): LotteryNumberSets {
    try {
      const parsed = JSON.parse(response);
      return parsed.recommendations;
    } catch (error) {
      console.error('응답 파싱 중 오류:', error);
      throw new Error('GPT 응답을 파싱할 수 없습니다.');
    }
  }

  parseRecommendationFromResponse(response: string): GPTRecommendationResult {
    try {
      const parsed = JSON.parse(response);
      return {
        numbers: parsed.recommendations,
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