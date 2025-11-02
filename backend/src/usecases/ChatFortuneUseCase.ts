/**
 * 채팅형 운세 UseCase
 */
import { FortuneSession } from '../entities/FortuneSession';
import { ConversationLog } from '../entities/ConversationLog';
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { IConversationLogRepository } from '../repositories/IConversationLogRepository';
import { FortuneGPTService } from '../services/FortuneGPTService';
import { IdGenerator } from '../utils/idGenerator';
import { ChatResponse } from '../types/fortune';
import { isCategoryMismatch, getSuggestedCategories } from '../utils/categoryDetection';

export class ChatFortuneUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly logRepository: IConversationLogRepository,
    private readonly gptService: FortuneGPTService,
  ) {}

  async execute(
    sessionId: string,
    userInput: string,
  ): Promise<{ response: ChatResponse; session: FortuneSession }> {
    // 세션 조회
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('세션을 찾을 수 없습니다.');
    }

    if (!session.isActive) {
      throw new Error('세션이 종료되었습니다.');
    }

    // 시간 확인
    if (session.remainingTime <= 0) {
      throw new Error('사용 가능한 시간이 없습니다. 결제를 진행해주세요.');
    }

    const startTime = Date.now();

    // 카테고리 이탈 감지
    const categoryMismatch = isCategoryMismatch(session.category, userInput);

    if (categoryMismatch) {
      // 카테고리 이탈 시 안내 메시지 반환
      const suggestions = getSuggestedCategories(session.category, 3);
      
      const categoryNames: Record<string, string> = {
        SASA: '사주',
        TAROT: '타로',
        DREAM: '꿈해몽',
        LUCKY_NUMBER: '행운번호',
        LOVE: '연애운',
        CAREER: '직장운',
        BUSINESS: '사업운',
        LUCKY_DAY: '길일',
        MOVING: '이사',
        CAR_PURCHASE: '차구매',
        NAMING: '작명',
        NICKNAME: '닉네임',
      };

      const currentCategoryName = categoryNames[session.category] || session.category;
      const suggestedNames = suggestions.map(c => categoryNames[c] || c);

      const mismatchResponse: ChatResponse = {
        summary: `현재 세션은 "${currentCategoryName}" 카테고리로 진행 중입니다.\n다른 카테고리 질문은 해당 카테고리로 새 세션을 생성해주세요.`,
        points: [
          `이 세션에서는 "${currentCategoryName}"에 대한 질문만 답변 가능합니다.`,
          `다른 카테고리 질문을 원하시면 새 세션을 생성해주세요.`,
        ],
        tips: [
          `관련 카테고리: ${suggestedNames.join(', ')}`,
          `새 세션 생성 후 해당 카테고리로 질문해주세요.`,
        ],
        disclaimer: '본 안내는 카테고리별 세션 제한 정책에 따라 표시됩니다.',
        suggestPayment: false,
      };

      return {
        response: mismatchResponse,
        session, // 시간 소비 없음
      };
    }

    // 이전 대화 맥락 조회
    const previousLogs = await this.logRepository.findBySessionId(sessionId);
    const previousContext = previousLogs.length > 0
      ? previousLogs.slice(-3).map(log => `Q: ${log.userInput}\nA: ${log.aiOutput}`).join('\n\n')
      : undefined;

    // GPT 응답 생성
    const chatResponse = await this.gptService.generateChatResponse(
      session.category,
      userInput,
      previousContext,
    );

    const endTime = Date.now();
    const elapsedTime = Math.ceil((endTime - startTime) / 1000); // 초 단위

    // 시간 소비 (응답 생성 시간 + 5초 기본 대화 시간)
    const consumedTime = elapsedTime + 5;
    const updatedSession = session.consumeTime(consumedTime);

    // 결제 연장 필요 여부 확인 및 알림 메시지 추가
    if (updatedSession.needsPaymentPrompt()) {
      chatResponse.suggestPayment = true;
      
      // 만료 임박 또는 만료된 경우 구체적인 안내 메시지 추가
      if (updatedSession.remainingTime <= 0) {
        chatResponse.summary = (chatResponse.summary || '') + '\n⏰ 사용 가능한 시간이 모두 소진되었습니다.';
        if (!chatResponse.tips) {
          chatResponse.tips = [];
        }
        chatResponse.tips.unshift(
          '홍시를 구매하여 상담을 계속하세요! (5분/10분/30분 단위)',
        );
      } else if (updatedSession.remainingTime <= 30) {
        // 30초 이하 남은 경우
        if (!chatResponse.tips) {
          chatResponse.tips = [];
        }
        chatResponse.tips.push(
          `⏰ 남은 시간이 ${updatedSession.remainingTime}초입니다. 홍시를 구매하여 상담을 이어가세요!`,
        );
      }
    }

    // 대화 로그 저장
    const logId = IdGenerator.generateConversationLogId();
    const log = ConversationLog.create(
      logId,
      sessionId,
      userInput,
      JSON.stringify(chatResponse),
      elapsedTime,
      session.remainingTime !== updatedSession.remainingTime, // 시간이 소비되었으면 유료
    );

    await this.logRepository.create(log);

    // 세션 업데이트
    const savedSession = await this.sessionRepository.update(updatedSession);

    return {
      response: chatResponse,
      session: savedSession,
    };
  }
}
