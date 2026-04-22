import { FortuneCategory } from '../types/fortune';

export interface CategoryPromptOverrides {
  instruction?: string;
  nextStepRules?: string;
  toneGuide?: string;
}

const EMPTY: CategoryPromptOverrides = {};

/**
 * 채팅형 카테고리 규칙
 * 기본 해석 구조(Scene→Emotion→Flow)는 sasa.prompts.ts에서 처리
 * 여기서는 "무엇을 중심으로 볼지"만 정의
 */

export const CHAT_CATEGORY_OVERRIDES: Record<
  FortuneCategory,
  CategoryPromptOverrides
> = {
  [FortuneCategory.SAJU]: {
    instruction: `
- 사주는 기질과 시기 흐름을 배경으로 해석하라.
- 대운, 세운 같은 흐름이 자연스럽게 스며들게 하라.`,
    nextStepRules: `
- 시기 흐름이나 운의 변곡점을 nextQuestions로 이어라.`,
  },

  [FortuneCategory.DREAM]: {
    instruction: `
- 꿈은 장면과 상징, 당시 감정을 중심으로 해석하라.`,
    nextStepRules: `
- 꿈의 다른 장면이나 반복 상징을 nextQuestions로 이어라.`,
  },

  [FortuneCategory.NEW_YEAR]: {
    instruction: `
- 한 해 전체보다 올해 가장 강한 흐름 하나를 먼저 짚어라.`,
    nextStepRules: `
- 월별 흐름이나 변곡 시기를 nextQuestions로 이어라.`,
  },

  [FortuneCategory.MONEY]: {
    instruction: `
- 돈운은 수입보다 돈에 대한 판단과 욕심의 흐름을 보라.`,
    nextStepRules: `
- 돈이 들어오는 흐름이나 지출 흐름을 nextQuestions로 이어라.`,
  },

  [FortuneCategory.HAND]: {
    instruction: `
- 손금은 가장 강한 선 하나를 중심으로 성향과 흐름을 읽어라.`,
  },

  [FortuneCategory.TOJEONG]: {
    instruction: `
- 토정은 월별 기복과 시기 흐름 중심으로 해석하라.`,
  },

  [FortuneCategory.BREAK_UP]: {
    instruction: `
- 이별은 관계보다 남은 감정의 결을 먼저 읽어라.`,
  },

  [FortuneCategory.CAR_PURCHASE]: {
    instruction: `
- 차 구매는 물건보다 욕심, 부담, 타이밍 흐름을 보라.`,
  },

  [FortuneCategory.BUSINESS]: {
    instruction: `
- 사업은 아이템보다 방향과 타이밍을 중심으로 보라.`,
  },

  [FortuneCategory.INVESTMENT]: {
    instruction: `
- 투자운은 종목보다 판단의 조급함과 흐름을 읽어라.`,
  },

  [FortuneCategory.LOVE]: {
    instruction: `
- 연애는 관계 자체보다 감정의 방향을 먼저 읽어라.`,
  },

  [FortuneCategory.LUCKY_NUMBER]: {
    instruction: `
- 숫자 하나보다 배열이 주는 인상과 기운을 보라.`,
  },

  [FortuneCategory.MOVING]: {
    instruction: `
- 이사는 공간보다 기운의 변화와 생활 흐름을 보라.`,
  },

  [FortuneCategory.TRAVEL]: {
    instruction: `
- 여행은 즐거움보다 회복과 전환의 흐름을 보라.`,
  },

  [FortuneCategory.COMPATIBILITY]: {
    instruction: `
- 궁합은 좋고 나쁨보다 두 사람의 감정 결을 읽어라.`,
  },

  [FortuneCategory.TAROT]: {
    instruction: `
- 타로는 결과보다 현재 에너지와 선택 흐름을 보라.`,
  },

  [FortuneCategory.CAREER]: {
    instruction: `
- 직업운은 일보다 방향과 지치는 지점을 보라.`,
  },

  [FortuneCategory.LUCKY_DAY]: {
    instruction: `
- 날짜는 결과보다 타이밍의 흐름으로 보라.`,
  },

  [FortuneCategory.NAMING]: {
    instruction: `
- 이름은 뜻보다 인상과 부르는 기운을 보라.`,
  },

  [FortuneCategory.DAILY]: {
    instruction: `
- 오늘운은 하루의 가장 강한 흐름 하나만 짚어라.`,
  },
};

/**
 * 문서형 카테고리 규칙
 * 문서는 설명형이므로 채팅보다 약간만 보강
 */

export const DOCUMENT_CATEGORY_OVERRIDES: Record<
  FortuneCategory,
  CategoryPromptOverrides
> = {
  [FortuneCategory.SAJU]: {
    instruction: `
- 기질, 현재 흐름, 앞으로의 시기를 구분해 정리하라.`,
  },

  [FortuneCategory.DREAM]: {
    instruction: `
- 꿈 장면, 상징, 감정을 나누어 해석하라.`,
  },

  [FortuneCategory.NEW_YEAR]: {
    instruction: `
- 올해 가장 강한 운의 흐름과 변곡 시기를 정리하라.`,
  },

  [FortuneCategory.MONEY]: {
    instruction: `
- 돈의 흐름과 재물 관리 방향을 중심으로 정리하라.`,
  },

  [FortuneCategory.HAND]: {
    instruction: `
- 가장 강한 손금 특징을 중심으로 해석하라.`,
  },

  [FortuneCategory.TOJEONG]: {
    instruction: `
- 월별 기복 흐름을 중심으로 정리하라.`,
  },

  [FortuneCategory.BREAK_UP]: EMPTY,
  [FortuneCategory.CAR_PURCHASE]: EMPTY,
  [FortuneCategory.BUSINESS]: EMPTY,
  [FortuneCategory.INVESTMENT]: EMPTY,
  [FortuneCategory.LOVE]: EMPTY,
  [FortuneCategory.LUCKY_NUMBER]: EMPTY,
  [FortuneCategory.MOVING]: EMPTY,
  [FortuneCategory.TRAVEL]: EMPTY,
  [FortuneCategory.COMPATIBILITY]: EMPTY,
  [FortuneCategory.TAROT]: EMPTY,
  [FortuneCategory.CAREER]: EMPTY,
  [FortuneCategory.LUCKY_DAY]: EMPTY,
  [FortuneCategory.NAMING]: EMPTY,
  [FortuneCategory.DAILY]: EMPTY,
};