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
 * 
 * 무료 상품은 0원으로 설정 (무료 홍시 시스템 사용)
 */
export const CHAT_PRICE_PER_MINUTE: Record<FortuneCategory, number> = {
  // TRADITIONAL
  [FortuneCategory.SAJU]: 0,              // 사주: 무료
  [FortuneCategory.NEW_YEAR]: 0,          // 신년운세: 무료
  [FortuneCategory.MONEY]: 0,              // 횡재수 & 금전운: 무료
  [FortuneCategory.HAND]: 0,               // 손금: 무료
  [FortuneCategory.TOJEONG]: 0,            // 토정비결: 무료
  
  // ASK
  [FortuneCategory.BREAK_UP]: 0,          // 헤어진 연인 재회: 무료
  [FortuneCategory.CAR_PURCHASE]: 0,       // 차구매: 무료
  [FortuneCategory.BUSINESS]: 0,           // 사업운: 무료
  [FortuneCategory.INVESTMENT]: 0,         // 투자 상담: 무료
  [FortuneCategory.LOVE]: 0,               // 연애운: 무료
  [FortuneCategory.DREAM]: 800,            // 꿈해몽: 800원/분 (10분 기준 8000원, 할인 후 5000원)
  [FortuneCategory.LUCKY_NUMBER]: 0,       // 행운번호(로또): 무료
  [FortuneCategory.MOVING]: 0,             // 이사: 무료
  [FortuneCategory.TRAVEL]: 0,             // 여행운 & 방향: 무료
  [FortuneCategory.COMPATIBILITY]: 0,      // 궁합: 무료
  [FortuneCategory.TAROT]: 0,              // 타로: 무료
  [FortuneCategory.CAREER]: 0,             // 직장운: 무료
  [FortuneCategory.LUCKY_DAY]: 0,          // 길일: 무료
  [FortuneCategory.NAMING]: 0,             // 작명: 무료
  
  // DAILY
  [FortuneCategory.DAILY]: 0,              // 오늘의 운세: 무료
};

/**
 * 문서형 가격 (원)
 * originalPrice 기준으로 설정됨
 */
export const DOCUMENT_PRICES: Record<FortuneCategory, number> = {
  // TRADITIONAL
  [FortuneCategory.SAJU]: 15000,          // 사주팔자: 15000원 (할인 전)
  [FortuneCategory.NEW_YEAR]: 30000,       // 신년운세: 30000원 (할인 전)
  [FortuneCategory.MONEY]: 5000,           // 횡재수 & 금전운: 5000원 (할인 전)
  [FortuneCategory.HAND]: 18000,           // 손금: 18000원 (할인 전)
  [FortuneCategory.TOJEONG]: 15000,        // 토정비결: 15000원 (할인 전)
  
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
  // TRADITIONAL
  [FortuneCategory.SAJU]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 33,  // 사주팔자: 15000원 → 10000원 (33% 할인)
  },
  [FortuneCategory.NEW_YEAR]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 33,  // 신년운세: 30000원 → 20000원 (33% 할인)
  },
  [FortuneCategory.MONEY]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 50,  // 횡재수 & 금전운: 5000원 → 2500원 (50% 할인)
  },
  [FortuneCategory.HAND]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 33,  // 손금: 18000원 → 12000원 (33% 할인)
  },
  [FortuneCategory.TOJEONG]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 33,  // 토정비결: 15000원 → 10000원 (33% 할인)
  },
  
  // ASK
  [FortuneCategory.BREAK_UP]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.CAR_PURCHASE]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.BUSINESS]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.INVESTMENT]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.LOVE]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.DREAM]: {
    chat: {
      5: 0,
      10: 38,  // 꿈해몽: 8000원 → 5000원 (38% 할인)
      30: 38,
    },
    document: 0,
  },
  [FortuneCategory.LUCKY_NUMBER]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.MOVING]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.TRAVEL]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.COMPATIBILITY]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.TAROT]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.CAREER]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.LUCKY_DAY]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  [FortuneCategory.NAMING]: {
    chat: { 5: 0, 10: 0, 30: 0 },
    document: 0,
  },
  
  // DAILY
  [FortuneCategory.DAILY]: {
    chat: { 5: 0, 10: 0, 30: 0 },
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
