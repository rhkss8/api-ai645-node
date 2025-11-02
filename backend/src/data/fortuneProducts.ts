/**
 * 운세 상품 정보 데이터
 * 
 * 이 파일을 수정하여 상품 가격 및 정보를 관리합니다.
 * 변경 후 서버 재시작이 필요합니다.
 */

import { FortuneCategory, FortuneProductType } from '../types/fortune';

/**
 * 채팅형 시간별 가격 (분당 가격, 원)
 * 각 카테고리별로 1분당 가격이 설정됩니다.
 * 실제 가격 = 분당가격 * 시간(분)
 */
export const CHAT_PRICE_PER_MINUTE: Record<FortuneCategory, number> = {
  [FortuneCategory.SASA]: 1000,        // 1분당 1,000원
  [FortuneCategory.TAROT]: 1000,
  [FortuneCategory.DREAM]: 600,
  [FortuneCategory.LUCKY_NUMBER]: 600,
  [FortuneCategory.LOVE]: 1000,
  [FortuneCategory.CAREER]: 1000,
  [FortuneCategory.BUSINESS]: 1400,
  [FortuneCategory.LUCKY_DAY]: 600,
  [FortuneCategory.MOVING]: 1000,
  [FortuneCategory.CAR_PURCHASE]: 1000,
  [FortuneCategory.NAMING]: 1400,
  [FortuneCategory.NICKNAME]: 600,
};

/**
 * 문서형 가격 (원)
 */
export const DOCUMENT_PRICES: Record<FortuneCategory, number> = {
  [FortuneCategory.SASA]: 3000,
  [FortuneCategory.TAROT]: 3000,
  [FortuneCategory.DREAM]: 2000,
  [FortuneCategory.LUCKY_NUMBER]: 2000,
  [FortuneCategory.LOVE]: 3000,
  [FortuneCategory.CAREER]: 3000,
  [FortuneCategory.BUSINESS]: 5000,
  [FortuneCategory.LUCKY_DAY]: 2000,
  [FortuneCategory.MOVING]: 3000,
  [FortuneCategory.CAR_PURCHASE]: 3000,
  [FortuneCategory.NAMING]: 5000,
  [FortuneCategory.NICKNAME]: 2000,
};

/**
 * 할인률 설정 (0~100, 예: 10 = 10% 할인)
 * 카테고리별, 시간별 할인률을 설정할 수 있습니다.
 */
export const DISCOUNT_RATES: Record<
  FortuneCategory,
  {
    chat?: Record<number, number>;  // 시간(분)별 할인률
    document?: number;              // 문서형 할인률
    default?: number;              // 기본 할인률
  }
> = {
  [FortuneCategory.SASA]: {
    chat: {
      5: 0,    // 5분: 할인 없음
      10: 10,  // 10분: 10% 할인
      30: 20,  // 30분: 20% 할인
    },
    document: 0,
  },
  [FortuneCategory.TAROT]: {
    chat: {
      5: 0,
      10: 10,
      30: 20,
    },
    document: 0,
  },
  [FortuneCategory.DREAM]: {
    chat: {
      5: 0,
      10: 5,
      30: 15,
    },
    document: 0,
  },
  [FortuneCategory.LUCKY_NUMBER]: {
    chat: {
      5: 0,
      10: 5,
      30: 15,
    },
    document: 0,
  },
  [FortuneCategory.LOVE]: {
    chat: {
      5: 0,
      10: 10,
      30: 20,
    },
    document: 0,
  },
  [FortuneCategory.CAREER]: {
    chat: {
      5: 0,
      10: 10,
      30: 20,
    },
    document: 0,
  },
  [FortuneCategory.BUSINESS]: {
    chat: {
      5: 0,
      10: 15,
      30: 25,
    },
    document: 5,
  },
  [FortuneCategory.LUCKY_DAY]: {
    chat: {
      5: 0,
      10: 5,
      30: 15,
    },
    document: 0,
  },
  [FortuneCategory.MOVING]: {
    chat: {
      5: 0,
      10: 10,
      30: 20,
    },
    document: 0,
  },
  [FortuneCategory.CAR_PURCHASE]: {
    chat: {
      5: 0,
      10: 10,
      30: 20,
    },
    document: 0,
  },
  [FortuneCategory.NAMING]: {
    chat: {
      5: 0,
      10: 15,
      30: 25,
    },
    document: 5,
  },
  [FortuneCategory.NICKNAME]: {
    chat: {
      5: 0,
      10: 5,
      30: 15,
    },
    document: 0,
  },
};

/**
 * 채팅형 사용 가능한 시간 옵션 (분)
 */
export const AVAILABLE_CHAT_DURATIONS = [5, 10, 30] as const;

/**
 * 상품 설명 템플릿
 * 각 상품 타입별 설명 템플릿
 */
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
  [FortuneCategory.SASA]: '사주',
  [FortuneCategory.TAROT]: '타로',
  [FortuneCategory.DREAM]: '꿈해몽',
  [FortuneCategory.LUCKY_NUMBER]: '행운번호',
  [FortuneCategory.LOVE]: '연애운',
  [FortuneCategory.CAREER]: '직장운',
  [FortuneCategory.BUSINESS]: '사업운',
  [FortuneCategory.LUCKY_DAY]: '길일',
  [FortuneCategory.MOVING]: '이사',
  [FortuneCategory.CAR_PURCHASE]: '차구매',
  [FortuneCategory.NAMING]: '작명',
  [FortuneCategory.NICKNAME]: '닉네임',
};
