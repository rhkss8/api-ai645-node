/**
 * 프롬프트 로더
 * 카테고리별 프롬프트 파일을 동적으로 로드
 */
import { FortuneCategory, SessionMode } from '../types/fortune';
import { extractFortuneTopicFromCategoryAndInput, generateAnalysisTarget } from '../utils/fortuneTopicExtractor';
import { CHAT_CATEGORY_OVERRIDES, DOCUMENT_CATEGORY_OVERRIDES } from './categoryPromptOverrides';
import { CATEGORY_NAMES } from '../data/fortuneProducts';
import { getCategorySpecificChatPrompt, getCategorySpecificDocumentPrompt } from './categorySpecificPrompts';

// 채팅형 프롬프트 import
import { SAJUChatPrompt } from './chat/saju.prompt';
import { BUSINESSChatPrompt } from './chat/business.prompt';
import { BREAK_UPChatPrompt } from './chat/breakUp.prompt';
import { CAR_PURCHASEChatPrompt } from './chat/carPurchase.prompt';
import { CAREERChatPrompt } from './chat/career.prompt';
import { COMPATIBILITYChatPrompt } from './chat/compatibility.prompt';
import { DREAMChatPrompt } from './chat/dream.prompt';
import { DAILYChatPrompt } from './chat/daily.prompt';
import { FACEChatPrompt } from './chat/face.prompt';
import { HANDChatPrompt } from './chat/hand.prompt';
import { INVESTMENTChatPrompt } from './chat/investment.prompt';
import { LOVEChatPrompt } from './chat/love.prompt';
import { LUCKY_NUMBERChatPrompt } from './chat/luckyNumber.prompt';
import { LUCKY_DAYChatPrompt } from './chat/luckyDay.prompt';
import { MONEYChatPrompt } from './chat/money.prompt';
import { MOVINGChatPrompt } from './chat/moving.prompt';
import { NAMINGChatPrompt } from './chat/naming.prompt';
import { NEW_YEARChatPrompt } from './chat/newYear.prompt';
import { TAROTChatPrompt } from './chat/tarot.prompt';
import { TOJEONGChatPrompt } from './chat/tojeong.prompt';
import { TRAVELChatPrompt } from './chat/travel.prompt';

// 문서형 프롬프트 import
import { SAJUDocumentPrompt } from './document/saju.prompt';
import { BUSINESSDocumentPrompt } from './document/business.prompt';
import { BREAK_UPDocumentPrompt } from './document/breakUp.prompt';
import { CAR_PURCHASEDocumentPrompt } from './document/carPurchase.prompt';
import { CAREERDocumentPrompt } from './document/career.prompt';
import { COMPATIBILITYDocumentPrompt } from './document/compatibility.prompt';
import { DREAMDocumentPrompt } from './document/dream.prompt';
import { DAILYDocumentPrompt } from './document/daily.prompt';
import { FACEDocumentPrompt } from './document/face.prompt';
import { HANDDocumentPrompt } from './document/hand.prompt';
import { INVESTMENTDocumentPrompt } from './document/investment.prompt';
import { LOVEDocumentPrompt } from './document/love.prompt';
import { LUCKY_NUMBERDocumentPrompt } from './document/luckyNumber.prompt';
import { LUCKY_DAYDocumentPrompt } from './document/luckyDay.prompt';
import { MONEYDocumentPrompt } from './document/money.prompt';
import { MOVINGDocumentPrompt } from './document/moving.prompt';
import { NAMINGDocumentPrompt } from './document/naming.prompt';
import { NEW_YEARDocumentPrompt } from './document/newYear.prompt';
import { TAROTDocumentPrompt } from './document/tarot.prompt';
import { TOJEONGDocumentPrompt } from './document/tojeong.prompt';
import { TRAVELDocumentPrompt } from './document/travel.prompt';

/**
 * 카테고리별 채팅형 프롬프트 맵
 * 새로운 카테고리 추가 시 여기에 import 및 추가
 */
const CHAT_PROMPTS: Record<FortuneCategory, string> = {
  [FortuneCategory.SAJU]: SAJUChatPrompt,
  // TODO: 다른 카테고리 프롬프트 추가
  [FortuneCategory.NEW_YEAR]: NEW_YEARChatPrompt,
  [FortuneCategory.MONEY]: MONEYChatPrompt,
  [FortuneCategory.HAND]: HANDChatPrompt,
  [FortuneCategory.FACE]: FACEChatPrompt,
  [FortuneCategory.TOJEONG]: TOJEONGChatPrompt,
  [FortuneCategory.BREAK_UP]: BREAK_UPChatPrompt,
  [FortuneCategory.CAR_PURCHASE]: CAR_PURCHASEChatPrompt,
  [FortuneCategory.BUSINESS]: BUSINESSChatPrompt,
  [FortuneCategory.INVESTMENT]: INVESTMENTChatPrompt,
  [FortuneCategory.LOVE]: LOVEChatPrompt,
  [FortuneCategory.DREAM]: DREAMChatPrompt,
  [FortuneCategory.LUCKY_NUMBER]: LUCKY_NUMBERChatPrompt,
  [FortuneCategory.MOVING]: MOVINGChatPrompt,
  [FortuneCategory.TRAVEL]: TRAVELChatPrompt,
  [FortuneCategory.COMPATIBILITY]: COMPATIBILITYChatPrompt,
  [FortuneCategory.TAROT]: TAROTChatPrompt,
  [FortuneCategory.CAREER]: CAREERChatPrompt,
  [FortuneCategory.LUCKY_DAY]: LUCKY_DAYChatPrompt,
  [FortuneCategory.NAMING]: NAMINGChatPrompt,
  [FortuneCategory.DAILY]: DAILYChatPrompt,
};

/**
 * 카테고리별 문서형 프롬프트 맵
 */
const DOCUMENT_PROMPTS: Record<FortuneCategory, string> = {
  [FortuneCategory.SAJU]: SAJUDocumentPrompt,
  // TODO: 다른 카테고리 프롬프트 추가
  [FortuneCategory.NEW_YEAR]: NEW_YEARDocumentPrompt,
  [FortuneCategory.MONEY]: MONEYDocumentPrompt,
  [FortuneCategory.HAND]: HANDDocumentPrompt,
  [FortuneCategory.FACE]: FACEDocumentPrompt,
  [FortuneCategory.TOJEONG]: TOJEONGDocumentPrompt,
  [FortuneCategory.BREAK_UP]: BREAK_UPDocumentPrompt,
  [FortuneCategory.CAR_PURCHASE]: CAR_PURCHASEDocumentPrompt,
  [FortuneCategory.BUSINESS]: BUSINESSDocumentPrompt,
  [FortuneCategory.INVESTMENT]: INVESTMENTDocumentPrompt,
  [FortuneCategory.LOVE]: LOVEDocumentPrompt,
  [FortuneCategory.DREAM]: DREAMDocumentPrompt,
  [FortuneCategory.LUCKY_NUMBER]: LUCKY_NUMBERDocumentPrompt,
  [FortuneCategory.MOVING]: MOVINGDocumentPrompt,
  [FortuneCategory.TRAVEL]: TRAVELDocumentPrompt,
  [FortuneCategory.COMPATIBILITY]: COMPATIBILITYDocumentPrompt,
  [FortuneCategory.TAROT]: TAROTDocumentPrompt,
  [FortuneCategory.CAREER]: CAREERDocumentPrompt,
  [FortuneCategory.LUCKY_DAY]: LUCKY_DAYDocumentPrompt,
  [FortuneCategory.NAMING]: NAMINGDocumentPrompt,
  [FortuneCategory.DAILY]: DAILYDocumentPrompt,
};

function formatUserDataForPrompt(userData?: Record<string, any>): string {
  if (!userData) {
    return '없음';
  }

  const { documentBridge, ...plainUserData } = userData;
  const hasPlainUserData = Object.keys(plainUserData).length > 0;

  return hasPlainUserData
    ? JSON.stringify(plainUserData, null, 2)
    : '없음';
}

function formatDocumentBridgeForPrompt(userData?: Record<string, any>): string {
  const bridge = userData?.documentBridge as
    | {
        title?: string;
        anchorSummary?: string | null;
        topicCards?: Array<{ topic?: string; summary?: string; watchouts?: string[]; recommendedQuestions?: string[] }>;
        riskNotes?: string[];
      }
    | undefined;

  if (!bridge) {
    return '문서 기반 상담 컨텍스트 없음';
  }

  const topicLines = (bridge.topicCards || [])
    .slice(0, 4)
    .map((card) => {
      const watchout = card.watchouts?.[0] ? ` / 주의: ${card.watchouts[0]}` : '';
      return `- ${card.topic || 'topic'}: ${card.summary || ''}${watchout}`;
    })
    .join('\n');

  const riskLines = (bridge.riskNotes || [])
    .slice(0, 3)
    .map((item) => `- ${item}`)
    .join('\n');

  return [
    `문서 제목: ${bridge.title || '제목 없음'}`,
    `핵심 요약: ${bridge.anchorSummary || '없음'}`,
    topicLines ? `토픽 카드:\n${topicLines}` : '',
    riskLines ? `주의 메모:\n${riskLines}` : '',
    '이 컨텍스트는 기존 문서 결과를 기반으로 새 채팅 상담을 시작하기 위한 압축 정보다. 문서 원문을 다시 길게 반복하지 말고, 필요한 토픽만 골라 현재 질문에 맞춰 활용하라.',
  ]
    .filter(Boolean)
    .join('\n');
}

function getSharedChatToneGuide(): string {
  return `
- 사용자의 이름을 반복해서 부르지 말라.
- 첫 문장에서 결론부터 짧게 말하고, 설명은 2~4문장 안에서 끝내라.
- 문장은 짧게 끊고, 길게 낭독하듯 이어 쓰지 말라.
- 필요하면 1~2개의 짧은 문단으로만 나눠라.
- 같은 의미를 반복하지 말고 핵심 흐름, 시기, 주의점만 남겨라.
- "있사오니", "하오", "이르러서" 같은 과한 고어체를 피하고 현대 한국어로 답하라.`;
}

function getSharedDocumentToneGuide(): string {
  return `
- 사용자의 이름을 제목, summary, content에서 반복해서 부르지 말라.
- summary는 짧은 2~3문장으로, 핵심 흐름과 주의 구간만 담아라.
- content는 긴 한 덩어리 문단으로 쓰지 말고 2~4개의 짧은 문단으로 끊어라.
- 각 문단은 2~4문장 안에서 끝내고, 같은 의미를 반복하지 말라.
- 군더더기 수식어보다 시기, 변곡점, 행동 포인트를 우선하라.
- "있사오니", "하오", "이르러서" 같은 과한 고어체를 피하고 현대 한국어로 정리하라.`;
}

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
    hasImageInput?: boolean;
  },
): string {
  const currentYear = new Date().getFullYear().toString();
  const template = mode === SessionMode.CHAT 
    ? CHAT_PROMPTS[category] 
    : DOCUMENT_PROMPTS[category];

  if (!template) {
    throw new Error(`카테고리 ${category}에 대한 ${mode} 프롬프트를 찾을 수 없습니다.`);
  }

  // 카테고리와 사용자 입력을 결합하여 운세 주제 추출
  const topicInfo = extractFortuneTopicFromCategoryAndInput(category, params.userInput);
  const analysisTarget = generateAnalysisTarget(topicInfo.topics, category);

  // 카테고리별 추가 지침 (Instruction, 다음 단계 유도 규칙, 말투 가이드)
  const overrides = mode === SessionMode.CHAT ? CHAT_CATEGORY_OVERRIDES[category] : DOCUMENT_CATEGORY_OVERRIDES[category];
  const categorySpecificGuide =
    mode === SessionMode.CHAT
      ? getCategorySpecificChatPrompt(category)
      : getCategorySpecificDocumentPrompt(category);
  const categoryInstruction = [overrides?.instruction ?? '', categorySpecificGuide]
    .filter(Boolean)
    .join('\n');
  const categoryNextStepRules = overrides?.nextStepRules ?? '';
  const categoryToneGuide = [
    mode === SessionMode.CHAT ? getSharedChatToneGuide() : getSharedDocumentToneGuide(),
    overrides?.toneGuide ?? '',
  ]
    .filter(Boolean)
    .join('\n');
  const imageInputGuide = params.hasImageInput
    ? '사용자가 이미지를 함께 보냈다. 텍스트 추측보다 첨부 이미지를 우선 근거로 해석하라.'
    : '첨부 이미지는 없다. 사용자 텍스트와 맥락만으로 해석하라.';

  // 변수 치환
  const categoryLabel = CATEGORY_NAMES[category] || category;
  let prompt = template
    .replace(/{fortuneCategory}/g, categoryLabel)
    .replace(/{userInput}/g, params.userInput || '')
    .replace(/{userData}/g, formatUserDataForPrompt(params.userData))
    .replace(/{focusArea}/g, topicInfo.focusArea)
    .replace(/{analysisTarget}/g, analysisTarget)
    .replace(/{categoryInstruction}/g, categoryInstruction)
    .replace(/{categoryNextStepRules}/g, categoryNextStepRules)
    .replace(/{categoryToneGuide}/g, categoryToneGuide)
    .replace(/{imageInputGuide}/g, imageInputGuide)
    .replace(/{currentYear}/g, currentYear);

  // 이전 맥락 추가 (채팅형만)
  if (mode === SessionMode.CHAT && params.previousContext) {
    prompt += `\n\n## 이전 대화 맥락:\n${params.previousContext}`;
  }

  if (mode === SessionMode.CHAT && params.userData?.documentBridge) {
    prompt += `\n\n## 문서 기반 상담 컨텍스트:\n${formatDocumentBridgeForPrompt(params.userData)}`;
  }

  return prompt;
}
