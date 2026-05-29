/**
 * 운세 상품 정보 데이터
 *
 * 이 파일을 수정하여 상품 가격 및 정보를 관리합니다.
 * 변경 후 서버 재시작이 필요합니다.
 */

import { FortuneCategory, FortuneProductType, ChatEntitlementDays } from '../types/fortune';

/**
 * 문서형 운세 상품의 기준 판매가 (KRW)
 * 문서형 최종 결제 금액은 아래 기준가와 DISCOUNT_RATES 조합으로 계산된다.
 */
export const DOCUMENT_PRICES: Record<FortuneCategory, number> = {
  // TRADITIONAL
  [FortuneCategory.SAJU]: 3800,
  [FortuneCategory.NEW_YEAR]: 3800,
  [FortuneCategory.MONEY]: 3800,
  [FortuneCategory.HAND]: 3800,
  [FortuneCategory.TOJEONG]: 3800,

  // ASK (대부분 문서형 없음)
  [FortuneCategory.BREAK_UP]: 5000,        // 기본값
  [FortuneCategory.CAR_PURCHASE]: 3000,    // 차구매: 기본값
  [FortuneCategory.BUSINESS]: 5000,        // 사업운: 기본값
  [FortuneCategory.INVESTMENT]: 5000,      // 투자 상담: 기본값
  [FortuneCategory.LOVE]: 5000,            // 연애운: 기본값
  [FortuneCategory.DREAM]: 5000,           // 꿈해몽: 기본값
  [FortuneCategory.LUCKY_NUMBER]: 5000,    // 행운번호: 기본값
  [FortuneCategory.MOVING]: 3000,          // 이사: 기본값
  [FortuneCategory.TRAVEL]: 5000,          // 여행운: 기본값
  [FortuneCategory.COMPATIBILITY]: 5000,   // 궁합: 기본값
  [FortuneCategory.TAROT]: 15000,          // 타로: 기본값
  [FortuneCategory.CAREER]: 5000,          // 직장운: 기본값
  [FortuneCategory.LUCKY_DAY]: 5000,       // 길일: 기본값
  [FortuneCategory.NAMING]: 5000,          // 작명: 기본값

  // DAILY
  [FortuneCategory.DAILY]: 5000,           // 오늘의 운세: 기본값
};

/**
 * Document discount rates (0–100). Chat top-ups use global prices, not this table.
 */
export const DISCOUNT_RATES: Record<
  FortuneCategory,
  {
    documentDiscountRate?: number;
    defaultDiscountRate?: number;
  }
> = {
  [FortuneCategory.SAJU]: { documentDiscountRate: 50 },
  [FortuneCategory.NEW_YEAR]: { documentDiscountRate: 50 },
  [FortuneCategory.MONEY]: { documentDiscountRate: 50 },
  [FortuneCategory.HAND]: { documentDiscountRate: 50 },
  [FortuneCategory.TOJEONG]: { documentDiscountRate: 50 },
  [FortuneCategory.BREAK_UP]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.CAR_PURCHASE]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.BUSINESS]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.INVESTMENT]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.LOVE]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.DREAM]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.LUCKY_NUMBER]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.MOVING]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.TRAVEL]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.COMPATIBILITY]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.TAROT]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.CAREER]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.LUCKY_DAY]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.NAMING]: { documentDiscountRate: 0, defaultDiscountRate: 100 },
  [FortuneCategory.DAILY]: { documentDiscountRate: 0 },
};

/** Chat pass lengths (days). Billable extension = 24h x days on User.chatUsableUntil */
export const CHAT_ENTITLEMENT_DAYS: readonly ChatEntitlementDays[] = [1, 7, 30];

/** Global chat top-up prices (KRW) */
const CHAT_TOPUP_AMOUNTS: Record<ChatEntitlementDays, number> = {
  1: 900,
  7: 5900,
  30: 9900,
};

export function getChatEntitlementAmount(days: ChatEntitlementDays): number {
  return CHAT_TOPUP_AMOUNTS[days];
}

export const PRODUCT_DESCRIPTIONS: Record<
  FortuneProductType,
  (categoryName: string, duration?: number) => string
> = {
  [FortuneProductType.CHAT_SESSION]: (categoryName: string, duration = 600) => {
    const minutes = duration / 60;
    return `${categoryName} 전문가와 ${minutes}분간 실시간 상담`;
  },
  [FortuneProductType.DOCUMENT_REPORT]: (categoryName: string) => {
    return `${categoryName} 상세 분석 리포트`;
  },
};

/**
 * 상품명 템플릿
 */
export const PRODUCT_NAMES: Record<
  FortuneProductType,
  (categoryName: string) => string
> = {
  [FortuneProductType.CHAT_SESSION]: (categoryName: string) => {
    return `${categoryName} 채팅 상담`;
  },
  [FortuneProductType.DOCUMENT_REPORT]: (categoryName: string) => {
    return `${categoryName} 리포트`;
  },
};

/**
 * 카테고리 한글명 매핑
 */
export const CATEGORY_NAMES: Record<FortuneCategory, string> = {
  // TRADITIONAL
  [FortuneCategory.SAJU]: '사주',
  [FortuneCategory.NEW_YEAR]: '신년운세',
  [FortuneCategory.MONEY]: '횡재수 & 금전운',
  [FortuneCategory.HAND]: '손금',
  [FortuneCategory.TOJEONG]: '토정비결',

  // ASK
  [FortuneCategory.BREAK_UP]: '헤어진 연인 재회',
  [FortuneCategory.CAR_PURCHASE]: '차구매',
  [FortuneCategory.BUSINESS]: '사업운',
  [FortuneCategory.INVESTMENT]: '투자 상담',
  [FortuneCategory.LOVE]: '연애운',
  [FortuneCategory.DREAM]: '꿈해몽',
  [FortuneCategory.LUCKY_NUMBER]: '행운번호(로또)',
  [FortuneCategory.MOVING]: '이사',
  [FortuneCategory.TRAVEL]: '여행운 & 방향',
  [FortuneCategory.COMPATIBILITY]: '궁합',
  [FortuneCategory.TAROT]: '타로',
  [FortuneCategory.CAREER]: '직장운',
  [FortuneCategory.LUCKY_DAY]: '길일',
  [FortuneCategory.NAMING]: '작명',

  // DAILY
  [FortuneCategory.DAILY]: '오늘의 운세',
};

/**
 * 문서형 상품 상세 이름 (카테고리명과 다를 수 있음)
 */
export const DOCUMENT_PRODUCT_NAMES: Record<FortuneCategory, string> = {
  // TRADITIONAL
  [FortuneCategory.SAJU]: '사주팔자',
  [FortuneCategory.NEW_YEAR]: '신년운세',
  [FortuneCategory.MONEY]: '횡재수 & 금전운',
  [FortuneCategory.HAND]: '손금',
  [FortuneCategory.TOJEONG]: '토정비결',

  // ASK (대부분 문서형 없음, 기본값 사용)
  [FortuneCategory.BREAK_UP]: '헤어진 연인 재회 리포트',
  [FortuneCategory.CAR_PURCHASE]: '차구매 리포트',
  [FortuneCategory.BUSINESS]: '사업운 리포트',
  [FortuneCategory.INVESTMENT]: '투자 상담 리포트',
  [FortuneCategory.LOVE]: '연애운 리포트',
  [FortuneCategory.DREAM]: '꿈해몽 리포트',
  [FortuneCategory.LUCKY_NUMBER]: '행운번호 리포트',
  [FortuneCategory.MOVING]: '이사 리포트',
  [FortuneCategory.TRAVEL]: '여행운 리포트',
  [FortuneCategory.COMPATIBILITY]: '궁합 리포트',
  [FortuneCategory.TAROT]: '타로 리포트',
  [FortuneCategory.CAREER]: '직장운 리포트',
  [FortuneCategory.LUCKY_DAY]: '길일 리포트',
  [FortuneCategory.NAMING]: '작명',

  // DAILY
  [FortuneCategory.DAILY]: '오늘의 운세',
};

/**
 * 채팅형 상품 상세 이름 (카테고리명과 다를 수 있음)
 */
export const CHAT_PRODUCT_NAMES: Partial<Record<FortuneCategory, string[]>> = {
  [FortuneCategory.BREAK_UP]: ['헤어진 연인 재회'],
  [FortuneCategory.BUSINESS]: ['사업운'],
  [FortuneCategory.INVESTMENT]: ['투자 상담'],
  [FortuneCategory.CAR_PURCHASE]: ['차구매'],
  [FortuneCategory.DREAM]: ['꿈해몽'],
  [FortuneCategory.LUCKY_NUMBER]: ['행운번호(로또)'],
  [FortuneCategory.MOVING]: ['이사'],
  [FortuneCategory.TRAVEL]: ['여행운 & 방향'],
  [FortuneCategory.COMPATIBILITY]: ['궁합'],
  [FortuneCategory.LOVE]: ['연애운'],
  // 기타 카테고리는 기본 카테고리명 사용
};

/**
 * ASK 카테고리별 초기 채팅 가이드 설정
 * 채팅 운세 시작 시 기본 채팅 문구를 보여주기 위한 설정
 *
 * 타입:
 * - 'AI_GENERATED': 사주 정보 기반 + category로 AI를 통해 답변 생성
 * - 'STATIC': 단순 안내 문구 (직접 문구 사용)
 */
export type InitialChatGuideType = 'AI_GENERATED' | 'STATIC';

export interface InitialChatGuide {
  type: InitialChatGuideType;
  content?: string; // STATIC 타입일 때 사용할 문구
  prompt?: string; // AI_GENERATED 타입일 때 사용할 프롬프트 (선택사항, 없으면 기본 프롬프트 사용)
}

export const INITIAL_CHAT_GUIDES: Record<FortuneCategory, InitialChatGuide | null> = {
  // TRADITIONAL - ASK가 아니므로 null
  [FortuneCategory.SAJU]: null,
  [FortuneCategory.NEW_YEAR]: null,
  [FortuneCategory.MONEY]: null,
  // 손금은 이미지 업로드 기반(ASK에서도 사용 가능하도록 가이드 제공)
  [FortuneCategory.HAND]: {
    type: 'STATIC',
    content:
      '손금 운세는 손바닥 사진이 필요해요. 손바닥(양손 가능)을 밝은 곳에서 선명하게 찍어서 이미지를 업로드해 주세요.',
  },
  [FortuneCategory.TOJEONG]: null,

  // ASK 카테고리
  [FortuneCategory.BREAK_UP]: {
    type: 'AI_GENERATED',
    // 사주 정보 기반으로 AI가 생성
  },
  [FortuneCategory.CAR_PURCHASE]: {
    type: 'AI_GENERATED',
    // 사주 정보 기반으로 AI가 생성
  },
  [FortuneCategory.BUSINESS]: {
    type: 'AI_GENERATED',
    // 사주 정보 기반으로 AI가 생성
  },
  [FortuneCategory.INVESTMENT]: {
    type: 'AI_GENERATED',
    // 사주 정보 기반으로 AI가 생성
  },
  [FortuneCategory.LOVE]: {
    type: 'AI_GENERATED',
    // 사주 정보 기반으로 AI가 생성
  },
  [FortuneCategory.DREAM]: {
    type: 'STATIC',
    content: '어떤 꿈을 꾸셨나요? 상세한 내용과 꿈에 대한 감정을 알려주세요.',
  },
  [FortuneCategory.LUCKY_NUMBER]: {
    type: 'STATIC',
    content:
      '로또 번호 추천은 이미지가 필요해요. (예: 손바닥/메모/상징 이미지 등) 이미지를 업로드해 주시면 그 흐름에 맞춰 번호를 추천해 드릴게요.',
  },
  [FortuneCategory.MOVING]: {
    type: 'AI_GENERATED',
    // 사주 정보 기반으로 AI가 생성
  },
  [FortuneCategory.TRAVEL]: {
    type: 'AI_GENERATED',
    // 사주 정보 기반으로 AI가 생성
  },
  [FortuneCategory.COMPATIBILITY]: {
    type: 'AI_GENERATED',
    // 사주 정보 기반으로 AI가 생성
  },
  [FortuneCategory.TAROT]: {
    type: 'STATIC',
    content: '타로 카드로 무엇을 알고 싶으신가요? 질문을 구체적으로 알려주세요.',
  },
  [FortuneCategory.CAREER]: {
    type: 'AI_GENERATED',
    // 사주 정보 기반으로 AI가 생성
  },
  [FortuneCategory.LUCKY_DAY]: {
    type: 'AI_GENERATED',
    // 사주 정보 기반으로 AI가 생성
  },
  [FortuneCategory.NAMING]: {
    type: 'STATIC',
    content: '작명을 원하시는 분의 생년월일시와 성별을 알려주세요.',
  },

  // DAILY
  [FortuneCategory.DAILY]: null,
};
