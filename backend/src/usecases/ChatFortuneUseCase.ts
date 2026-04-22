/**
 * 채팅형 운세 UseCase
 */
import { PrismaClient } from '@prisma/client';
import { FortuneSession } from '../entities/FortuneSession';
import { ConversationLog } from '../entities/ConversationLog';
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { IConversationLogRepository } from '../repositories/IConversationLogRepository';
import { FortuneGPTService } from '../services/FortuneGPTService';
import { IdGenerator } from '../utils/idGenerator';
import { ChatResponse, FortuneErrorCode, isChatResponseV2, SessionMode } from '../types/fortune';
import { isCategoryMismatch, getSuggestedCategories } from '../utils/categoryDetection';
import { buildPreviousContextForAI } from '../utils/buildPreviousContextForAI';
import { CATEGORY_NAMES } from '../data/fortuneProducts';
import { CustomError } from '../middlewares/errorHandler';

export class ChatFortuneUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly logRepository: IConversationLogRepository,
    private readonly gptService: FortuneGPTService,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    sessionId: string,
    userInput: string,
    userId: string,
  ): Promise<{ response: ChatResponse; session: FortuneSession; effectiveRemainingSeconds: number }> {
    // 세션 조회
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new CustomError(
        '세션을 찾을 수 없습니다.',
        404,
        'SESSION_NOT_FOUND' as FortuneErrorCode,
      );
    }
    if (session.userId !== userId) {
      throw new CustomError('권한이 없습니다.', 403, 'AUTH_REQUIRED' as FortuneErrorCode);
    }

    if (session.mode !== SessionMode.CHAT) {
      throw new CustomError('채팅 세션이 아닙니다.', 400, 'INVALID_REQUEST' as FortuneErrorCode);
    }

    const now = new Date();
    const userRow = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { chatUsableUntil: true },
    });
    const until = userRow?.chatUsableUntil;
    const accountSec =
      until && until.getTime() > now.getTime()
        ? Math.floor((until.getTime() - now.getTime()) / 1000)
        : 0;

    console.log('[채팅 요청] 세션·계정 상태:', {
      sessionId: session.id,
      isActive: session.isActive,
      chatUsableUntil: until?.toISOString(),
      accountSec,
    });

    if (!session.isActive) {
      throw new CustomError(
        '세션이 종료되었습니다.',
        400,
        'SESSION_EXPIRED' as FortuneErrorCode,
        { requiresPayment: false },
      );
    }

    if (!until || until.getTime() <= now.getTime()) {
      throw new CustomError(
        '채팅 이용 가능 시간이 만료되었습니다. 이용권을 구매해 주세요.',
        400,
        'SESSION_TIME_EXPIRED' as FortuneErrorCode,
        {
          requiresPayment: true,
          remainingTime: 0,
          productType: 'CHAT',
        },
      );
    }

    const startTime = Date.now();

    // 카테고리 이탈 감지
    const categoryMismatch = isCategoryMismatch(session.category, userInput);

    if (categoryMismatch) {
      // 카테고리 이탈 시 안내 메시지 반환
      const suggestions = getSuggestedCategories(session.category, 3);

      const currentCategoryName = CATEGORY_NAMES[session.category] || session.category;
      const suggestedNames = suggestions.map(c => CATEGORY_NAMES[c] || c);

      const mismatchResponse: ChatResponse = {
        message:
          `현재 세션은 "${currentCategoryName}" 카테고리로 진행 중입니다.\n` +
          `다른 카테고리 질문은 해당 카테고리로 새 세션을 생성해주세요.\n\n` +
          `관련 카테고리: ${suggestedNames.join(', ')}`,
        nextQuestions: [
          `지금 세션(${currentCategoryName})에서 질문을 이어갈게요.`,
          '새 세션을 만들고 다른 주제로 질문할게요.',
        ],
        suggestPayment: false,
      };

      return {
        response: mismatchResponse,
        session,
        effectiveRemainingSeconds: accountSec,
      };
    }

    // 이전 대화 맥락 조회 (슬림화: 최근 N턴, message/summary만, 길이 상한)
    const previousLogs = await this.logRepository.findBySessionId(sessionId);
    const previousContext = previousLogs.length > 0
      ? buildPreviousContextForAI(previousLogs, {
          maxTurns: 5,
          maxChars: 2000,
          aiOutputSummaryOnly: true,
        })
      : undefined;

    // GPT 응답 생성
    let chatResponse: ChatResponse;
    try {
      chatResponse = await this.gptService.generateChatResponse(
        session.category,
        userInput,
        previousContext,
        session.userData as Record<string, any> | undefined,
      );
    } catch (error: any) {
      console.error('[채팅 응답 생성] AI 서비스 실패:', error);
      
      // AI 할당량 초과
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('할당량')) {
        throw new CustomError(
          'AI 서비스 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.',
          429,
          'AI_QUOTA_EXCEEDED' as FortuneErrorCode,
          {
            requiresPayment: false,
            retryAfter: 60, // 60초 후 재시도 권장
          },
        );
      }
      
      // AI 생성 실패
      throw new CustomError(
        '운세 응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
        500,
        'AI_GENERATION_FAILED' as FortuneErrorCode,
        {
          requiresPayment: false,
        },
      );
    }

    const endTime = Date.now();
    const elapsedTime = Math.ceil((endTime - startTime) / 1000);

    const userAfter = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { chatUsableUntil: true },
    });
    const untilAfter = userAfter?.chatUsableUntil;
    const effectiveRemainingSeconds =
      untilAfter && untilAfter.getTime() > Date.now()
        ? Math.floor((untilAfter.getTime() - Date.now()) / 1000)
        : 0;

    if (effectiveRemainingSeconds > 0 && effectiveRemainingSeconds <= 30) {
      chatResponse.suggestPayment = true;
      if (isChatResponseV2(chatResponse)) {
        chatResponse.message =
          (chatResponse.message || '') +
          `\n\n⏰ 계정 채팅 이용 시간이 ${effectiveRemainingSeconds}초 남았습니다. 1일/7일/30일 이용권을 구매해 이어가실 수 있습니다.`;
      }
    }

    const logId = IdGenerator.generateConversationLogId();
    const log = ConversationLog.create(
      logId,
      sessionId,
      userInput,
      JSON.stringify(chatResponse),
      elapsedTime,
      false,
    );

    await this.logRepository.create(log);

    return {
      response: chatResponse,
      session,
      effectiveRemainingSeconds,
    };
  }
}
