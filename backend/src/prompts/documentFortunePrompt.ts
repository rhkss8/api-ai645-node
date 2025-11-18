/**
 * 문서형 운세 프롬프트 생성
 * @deprecated PromptLoader를 사용하세요
 */
import { FortuneCategory, DocumentResponse, SessionMode } from '../types/fortune';
import { loadPrompt } from './PromptLoader';

interface DocumentFortunePromptParams {
  category: FortuneCategory;
  userInput: string;
  userData?: Record<string, any>; // 구조화된 사용자 데이터
}

export function generateDocumentFortunePrompt(params: DocumentFortunePromptParams): string {
  return loadPrompt(params.category, SessionMode.DOCUMENT, {
    userInput: params.userInput,
    userData: params.userData,
  });
}
