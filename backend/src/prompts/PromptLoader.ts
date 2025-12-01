/**
 * 프롬프트 로더
 * 카테고리별 프롬프트 파일을 동적으로 로드
 */
import { FortuneCategory } from '../types/fortune';
import { SessionMode } from '../types/fortune';
import { extractFortuneTopicFromCategoryAndInput, generateAnalysisTarget } from '../utils/fortuneTopicExtractor';

// 채팅형 프롬프트 import
import { SASAChatPrompt } from './chat/sasa.prompt';

// 문서형 프롬프트 import
import { SASADocumentPrompt } from './document/sasa.prompt';

/**
 * 카테고리별 채팅형 프롬프트 맵
 * 새로운 카테고리 추가 시 여기에 import 및 추가
 */
const CHAT_PROMPTS: Record<FortuneCategory, string> = {
  [FortuneCategory.SAJU]: SASAChatPrompt,
  // TODO: 다른 카테고리 프롬프트 추가
  [FortuneCategory.NEW_YEAR]: SASAChatPrompt, // 임시
  [FortuneCategory.MONEY]: SASAChatPrompt, // 임시
  [FortuneCategory.HAND]: SASAChatPrompt, // 임시
  [FortuneCategory.TOJEONG]: SASAChatPrompt, // 임시
  [FortuneCategory.BREAK_UP]: SASAChatPrompt, // 임시
  [FortuneCategory.CAR_PURCHASE]: SASAChatPrompt, // 임시
  [FortuneCategory.BUSINESS]: SASAChatPrompt, // 임시
  [FortuneCategory.INVESTMENT]: SASAChatPrompt, // 임시
  [FortuneCategory.LOVE]: SASAChatPrompt, // 임시
  [FortuneCategory.DREAM]: SASAChatPrompt, // 임시
  [FortuneCategory.LUCKY_NUMBER]: SASAChatPrompt, // 임시
  [FortuneCategory.MOVING]: SASAChatPrompt, // 임시
  [FortuneCategory.TRAVEL]: SASAChatPrompt, // 임시
  [FortuneCategory.COMPATIBILITY]: SASAChatPrompt, // 임시
  [FortuneCategory.TAROT]: SASAChatPrompt, // 임시
  [FortuneCategory.CAREER]: SASAChatPrompt, // 임시
  [FortuneCategory.LUCKY_DAY]: SASAChatPrompt, // 임시
  [FortuneCategory.NAMING]: SASAChatPrompt, // 임시
  [FortuneCategory.DAILY]: SASAChatPrompt, // 임시
};

/**
 * 카테고리별 문서형 프롬프트 맵
 */
const DOCUMENT_PROMPTS: Record<FortuneCategory, string> = {
  [FortuneCategory.SAJU]: SASADocumentPrompt,
  // TODO: 다른 카테고리 프롬프트 추가
  [FortuneCategory.NEW_YEAR]: SASADocumentPrompt, // 임시
  [FortuneCategory.MONEY]: SASADocumentPrompt, // 임시
  [FortuneCategory.HAND]: SASADocumentPrompt, // 임시
  [FortuneCategory.TOJEONG]: SASADocumentPrompt, // 임시
  [FortuneCategory.BREAK_UP]: SASADocumentPrompt, // 임시
  [FortuneCategory.CAR_PURCHASE]: SASADocumentPrompt, // 임시
  [FortuneCategory.BUSINESS]: SASADocumentPrompt, // 임시
  [FortuneCategory.INVESTMENT]: SASADocumentPrompt, // 임시
  [FortuneCategory.LOVE]: SASADocumentPrompt, // 임시
  [FortuneCategory.DREAM]: SASADocumentPrompt, // 임시
  [FortuneCategory.LUCKY_NUMBER]: SASADocumentPrompt, // 임시
  [FortuneCategory.MOVING]: SASADocumentPrompt, // 임시
  [FortuneCategory.TRAVEL]: SASADocumentPrompt, // 임시
  [FortuneCategory.COMPATIBILITY]: SASADocumentPrompt, // 임시
  [FortuneCategory.TAROT]: SASADocumentPrompt, // 임시
  [FortuneCategory.CAREER]: SASADocumentPrompt, // 임시
  [FortuneCategory.LUCKY_DAY]: SASADocumentPrompt, // 임시
  [FortuneCategory.NAMING]: SASADocumentPrompt, // 임시
  [FortuneCategory.DAILY]: SASADocumentPrompt, // 임시
};

/**
 * 프롬프트 로드 및 변수 치환
 */
export function loadPrompt(
  category: FortuneCategory,
  mode: SessionMode,
  params: {
    userInput: string;
    userData?: Record<string, any>;
    previousContext?: string;
  },
): string {
  const template = mode === SessionMode.CHAT 
    ? CHAT_PROMPTS[category] 
    : DOCUMENT_PROMPTS[category];

  if (!template) {
    throw new Error(`카테고리 ${category}에 대한 ${mode} 프롬프트를 찾을 수 없습니다.`);
  }

  // 카테고리와 사용자 입력을 결합하여 운세 주제 추출
  const topicInfo = extractFortuneTopicFromCategoryAndInput(category, params.userInput);
  const analysisTarget = generateAnalysisTarget(topicInfo.topics, category);

  // 변수 치환
  let prompt = template
    .replace(/{userInput}/g, params.userInput || '')
    .replace(/{userData}/g, params.userData ? JSON.stringify(params.userData, null, 2) : '없음')
    .replace(/{focusArea}/g, topicInfo.focusArea)
    .replace(/{analysisTarget}/g, analysisTarget);

  // 이전 맥락 추가 (채팅형만)
  if (mode === SessionMode.CHAT && params.previousContext) {
    prompt += `\n\n## 이전 대화 맥락:\n${params.previousContext}`;
  }

  return prompt;
}

