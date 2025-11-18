/**
 * 채팅형 운세 프롬프트 생성
 * @deprecated PromptLoader를 사용하세요
 */
import { FortuneCategory, ChatResponse, SessionMode } from '../types/fortune';
import { loadPrompt } from './PromptLoader';

interface ChatFortunePromptParams {
  category: FortuneCategory;
  userInput: string;
  previousContext?: string;  // 이전 대화 맥락
  userData?: Record<string, any>; // 구조화된 사용자 데이터
}

export function generateChatFortunePrompt(params: ChatFortunePromptParams): string {
  return loadPrompt(params.category, SessionMode.CHAT, {
    userInput: params.userInput,
    userData: params.userData,
    previousContext: params.previousContext,
  });
}
