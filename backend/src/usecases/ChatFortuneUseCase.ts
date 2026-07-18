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
import { ChatResponse, FortuneCategory, FortuneErrorCode, isChatResponseV2, SessionMode } from '../types/fortune';
import { isCategoryMismatch, getSuggestedCategories } from '../utils/categoryDetection';
import { buildPreviousContextForAI } from '../utils/buildPreviousContextForAI';
import { CATEGORY_NAMES } from '../data/fortuneProducts';
import { CustomError } from '../middlewares/errorHandler';
import { buildMeaninglessChatResponse, isMeaninglessChatInput } from '../utils/chatInputGuard';

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
    image?: {
      mimeType: string;
      base64Data: string;
      filename?: string;
    },
  ): Promise<{ response: ChatResponse; session: FortuneSession; effectiveRemainingSeconds: number }> {
    // 세션 조회
    let session = await this.sessionRepository.findById(sessionId);
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

    const imageEnabledCategories = new Set<FortuneCategory>([
      FortuneCategory.HAND,
      FortuneCategory.FACE,
    ]);
    if (image && !imageEnabledCategories.has(session.category)) {
      throw new CustomError(
        '이미지 업로드는 현재 손금/관상 상담에서만 지원됩니다.',
        400,
        'INVALID_REQUEST' as FortuneErrorCode,
      );
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

    if (!session.isActive && until && until.getTime() > now.getTime()) {
      const revivedSession = new FortuneSession(
        session.id,
        session.userId,
        session.category,
        session.mode,
        accountSec,
        true,
        session.createdAt,
        until,
        session.formType,
        session.userInput,
        session.userData,
        until,
      );

      await this.sessionRepository.update(revivedSession);
      session = revivedSession;
    }

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

    if (isMeaninglessChatInput(userInput)) {
      const chatResponse = buildMeaninglessChatResponse();
      const logId = IdGenerator.generateConversationLogId();
      const log = ConversationLog.create(
        logId,
        sessionId,
        userInput,
        JSON.stringify(chatResponse),
        0,
        false,
      );

      await this.logRepository.create(log);

      return {
        response: chatResponse,
        session,
        effectiveRemainingSeconds: accountSec,
      };
    }

    // 카테고리 이탈 감지
    const categoryMismatch = isCategoryMismatch(session.category, userInput);

    // 이전 대화 맥락 조회 (슬림화: 최근 N턴, message/summary만, 길이 상한)
    const previousLogs = await this.logRepository.findBySessionId(sessionId);
    const previousContext = previousLogs.length > 0
      ? buildPreviousContextForAI(previousLogs, {
          maxTurns: 5,
          maxChars: 2000,
          aiOutputSummaryOnly: true,
        })
      : undefined;
    const seedContext =
      session.userInput && session.userInput.trim() && session.userInput.trim() !== userInput.trim()
        ? [
            '이 세션은 아래 초기 요청으로 시작되었다. 현재 질문이 후속 질문이라면 이 초기 요청의 핵심 맥락을 잊지 말고 함께 반영하라.',
            `초기 요청: ${session.userInput.trim()}`,
          ].join('\n')
        : undefined;

    const currentCategoryName = CATEGORY_NAMES[session.category] || session.category;
    const mismatchContext = categoryMismatch
      ? (() => {
          const suggestions = getSuggestedCategories(session.category, 3);
          const suggestedNames = suggestions.map((c) => CATEGORY_NAMES[c] || c);
          return [
            `현재 상담 세션 카테고리는 "${currentCategoryName}"입니다.`,
            '사용자가 다른 주제를 섞어 물어봐도 첫 문장에서 거절하지 말고, 현재 세션 맥락과 겹치는 핵심 의도부터 최대한 자연스럽게 이어서 답변하세요.',
            '완전히 다른 전문 영역이라 현재 세션으로 답하기 어렵다면, 지금 세션 기준으로 답할 수 있는 부분을 먼저 짚고 답변 마지막에만 짧게 다른 카테고리 세션을 권하세요.',
            '세션 이탈 자체를 강조하지 말고, 사용자가 왜 그 질문을 했는지의 흐름을 먼저 읽어 답변하세요.',
            `필요하면 관련 카테고리 예시로 ${suggestedNames.join(', ')} 정도만 가볍게 언급하세요.`,
          ].join('\n');
        })()
      : undefined;
    const effectivePreviousContext = [seedContext, previousContext, mismatchContext].filter(Boolean).join('\n\n') || undefined;

    // GPT 응답 생성
    let chatResponse: ChatResponse;
    try {
      chatResponse = await this.gptService.generateChatResponse(
        session.category,
        userInput,
        effectivePreviousContext,
        session.userData as Record<string, any> | undefined,
        image,
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
