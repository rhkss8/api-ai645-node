/**
 * 포포춘(For Fortune) 운세 서비스 타입 정의
 */
import { ApiResponse } from './common';

// 운세 카테고리
// 하나의 enum으로 통합 관리하며, formType으로 분류됨
export enum FortuneCategory {
  // TRADITIONAL (전통 운세)
  /** 사주 */
  SAJU = 'SAJU',
  /** 신년운세 */
  NEW_YEAR = 'NEW_YEAR',
  /** 횡재수 & 금전운 */
  MONEY = 'MONEY',
  /** 손금 */
  HAND = 'HAND',
  /** 관상 */
  FACE = 'FACE',
  /** 토정비결 */
  TOJEONG = 'TOJEONG',
  
  // ASK (자유 질문)
  /** 헤어진 연인 재회 */
  BREAK_UP = 'BREAK_UP',
  /** 차구매 */
  CAR_PURCHASE = 'CAR_PURCHASE',
  /** 사업운 */
  BUSINESS = 'BUSINESS',
  /** 투자 상담 */
  INVESTMENT = 'INVESTMENT',
  /** 연애운 */
  LOVE = 'LOVE',
  /** 꿈해몽 */
  DREAM = 'DREAM',
  /** 행운번호(로또) */
  LUCKY_NUMBER = 'LUCKY_NUMBER',
  /** 이사 */
  MOVING = 'MOVING',
  /** 여행운 & 방향 */
  TRAVEL = 'TRAVEL',
  /** 궁합 */
  COMPATIBILITY = 'COMPATIBILITY',
  /** 타로 */
  TAROT = 'TAROT',
  /** 직장운 */
  CAREER = 'CAREER',
  /** 길일 */
  LUCKY_DAY = 'LUCKY_DAY',
  /** 작명 */
  NAMING = 'NAMING',
  
  // DAILY (오늘의 운세)
  DAILY = 'DAILY',
}

/**
 * 카테고리별 문서 유효기간 (일 단위)
 * - TRADITIONAL (전통 운세): 1년 (365일)
 * - ASK (자유 질문): 1일
 * - DAILY (오늘의 운세): 1일
 */
export function getDocumentExpirationDays(category: FortuneCategory): number {
  // TRADITIONAL (전통 운세)
  const traditionalCategories = [
    FortuneCategory.SAJU,
    FortuneCategory.NEW_YEAR,
    FortuneCategory.MONEY,
    FortuneCategory.HAND,
    FortuneCategory.FACE,
    FortuneCategory.TOJEONG,
  ];
  
  if (traditionalCategories.includes(category)) {
    return 365; // 1년
  }
  
  // DAILY (오늘의 운세)
  if (category === FortuneCategory.DAILY) {
    return 1; // 1일
  }
  
  // ASK (자유 질문) - 나머지 모든 카테고리
  return 1; // 1일
}

/**
 * 카테고리별 기존 문서 체크 여부
 * true: 결제 전에 기존 문서 존재 여부를 체크하고 사용자에게 확인 요청
 * false: 기존 문서 체크하지 않음
 */
export function shouldCheckExistingDocument(category: FortuneCategory): boolean {
  // 모든 카테고리에 대해 설정 (현재는 TRADITIONAL만 true, 나중에 확장 가능)
  const checkExistingDocumentMap: Record<FortuneCategory, boolean> = {
    // TRADITIONAL (전통 운세) - 기존 문서 체크
    [FortuneCategory.SAJU]: true,
    [FortuneCategory.NEW_YEAR]: true,
    [FortuneCategory.MONEY]: true,
    [FortuneCategory.HAND]: true,
    [FortuneCategory.FACE]: true,
    [FortuneCategory.TOJEONG]: true,
    
    // ASK (자유 질문) - 현재는 체크하지 않음 (나중에 필요시 true로 변경)
    [FortuneCategory.BREAK_UP]: false,
    [FortuneCategory.CAR_PURCHASE]: false,
    [FortuneCategory.BUSINESS]: false,
    [FortuneCategory.INVESTMENT]: false,
    [FortuneCategory.LOVE]: false,
    [FortuneCategory.DREAM]: false,
    [FortuneCategory.LUCKY_NUMBER]: false,
    [FortuneCategory.MOVING]: false,
    [FortuneCategory.TRAVEL]: false,
    [FortuneCategory.COMPATIBILITY]: false,
    [FortuneCategory.TAROT]: false,
    [FortuneCategory.CAREER]: false,
    [FortuneCategory.LUCKY_DAY]: false,
    [FortuneCategory.NAMING]: false,
    
    // DAILY (오늘의 운세) - 체크하지 않음
    [FortuneCategory.DAILY]: false,
  };
  
  return checkExistingDocumentMap[category] ?? false;
}

// 세션 모드
export enum SessionMode {
  CHAT = 'CHAT',              // 채팅형
  DOCUMENT = 'DOCUMENT',      // 문서형
}

// 폼 타입 (베타 라우트)
export enum FormType {
  ASK = 'ASK',
  DAILY = 'DAILY',
  TRADITIONAL = 'TRADITIONAL',
}

// 결제 상품 타입 (일회성 결제)
export enum FortuneProductType {
  CHAT_SESSION = 'CHAT_SESSION',           // 채팅형 운세 세션 (일회성)
  DOCUMENT_REPORT = 'DOCUMENT_REPORT',      // 문서형 리포트 (일회성)
}

// 홍시(복채) 단위 (시간 구매)
export enum HongsiUnit {
  FREE = 'FREE',              // 무료 홍시 (1일 1회, 5분)
  MINUTES_5 = 'MINUTES_5',    // 5분
  MINUTES_10 = 'MINUTES_10',  // 10분
  MINUTES_30 = 'MINUTES_30',  // 30분
}

// 채팅형 운세 응답 (프롬프트 버전에 따라 스키마가 다를 수 있음)
export interface ChatResponseV1 {
  summary: string;
  points: string[];
  tips: string[];
  disclaimer: string;
  suggestPayment?: boolean; // 결제 연장 제안 여부
  /**
   * 요약(summary)에 기반한 다음 질문 추천 (채팅 유도용)
   * - 프론트에서 퀵 리플라이/버튼으로 사용 가능
   */
  nextQuestions?: string[];
}

export interface ChatResponseV2 {
  /**
   * 점술가가 말하듯 자연스럽게 이어지는 한 덩어리의 답변 텍스트
   */
  message: string;
  /**
   * 다음 단계로 이어지는 추천 질문(퀵 리플라이)
   */
  nextQuestions?: string[];
  suggestPayment?: boolean; // 결제 연장 제안 여부
}

export type ChatResponse = ChatResponseV1 | ChatResponseV2;

export function isChatResponseV2(response: ChatResponse): response is ChatResponseV2 {
  return typeof (response as any)?.message === 'string';
}

// 문서형 운세 응답
export interface DocumentResponse {
  title: string;
  date: string;
  summary: string;
  content: string;
  advice: string[];
  warnings: string[];
  chatPrompt: string;
}

export interface DocumentChatTopicCard {
  topic: string;
  summary: string;
  signals: string[];
  watchouts: string[];
  openLoops: string[];
  recommendedQuestions: string[];
}

export interface DocumentChatFollowupRule {
  topic: string;
  keywords: string[];
}

export interface DocumentChatBridgeContext {
  anchorSummary: string;
  topicCards: DocumentChatTopicCard[];
  followupMap: DocumentChatFollowupRule[];
  riskNotes: string[];
}

// 운세 API 응답 (공통)
export interface FortuneApiResponse extends ApiResponse {
  remainingTime?: number;      // 남은 시간 (초) - 채팅형만
  isFreeHongsi?: boolean;       // 무료 홍시 사용 여부
  paymentRequired?: boolean;    // 결제 필요 여부
  paymentAmount?: number;       // 결제 필요 금액
}

// 세션 생성 요청
export interface CreateFortuneSessionRequest {
  category: FortuneCategory;
  formType: FormType;
  mode: SessionMode;
  userInput: string;
  paymentId?: string;          // 즉시 결제 시 결제 ID (선택)
  useFreeHongsi?: boolean;     // 무료 홍시 사용 여부 (채팅형만)
}

// 세션 생성 응답
export interface CreateFortuneSessionResponse {
  sessionId: string;
  category: FortuneCategory;
  formType: FormType;
  mode: SessionMode;
  remainingTime: number;
  isActive: boolean;
  expiresAt: string;
  /** 일 단위 채팅 이용권 만료 시각(있을 때만) */
  chatEntitlementExpiresAt?: string;
  isPaid: boolean;             // 결제 여부
}

// 에러 코드 표준
export type FortuneErrorCode =
  | 'NEED_PAYMENT'              // 결제 필요
  | 'HONGSI_ALREADY_USED'       // 무료 홍시 이미 사용
  | 'SESSION_EXPIRED'           // 세션 만료
  | 'SESSION_NOT_FOUND'         // 세션을 찾을 수 없음
  | 'SESSION_TIME_EXPIRED'      // 세션 시간 만료 (결제 유도 필요)
  | 'CHAT_ACCOUNT_TIME_EXHAUSTED' // 계정 chatUsableUntil 없음/만료 — 세션 생성 불가, 이용권 구매 유도
  | 'CATEGORY_MISMATCH'         // 카테고리 불일치
  | 'TOKEN_INVALID'             // 토큰 무효
  | 'PAYMENT_UNVERIFIED'        // 결제 미검증
  | 'INVALID_FORMTYPE'          // 잘못된 폼 타입
  | 'INVALID_REQUEST'           // 잘못된 요청
  | 'AUTH_REQUIRED'             // 인증 필요
  | 'AI_QUOTA_EXCEEDED'         // AI 할당량 초과
  | 'AI_SERVICE_UNAVAILABLE'    // AI 서비스 일시 장애(과부하 등)
  | 'AI_GENERATION_FAILED';     // AI 생성 실패


/** 채팅 일 단위 이용권 (결제 후 달력 기준 만료) */
export type ChatEntitlementDays = 1 | 7 | 30;

// 결제 상품 정보
export interface FortuneProduct {
  productId: string;            // 상품 고유 ID
  type: FortuneProductType;
  category: FortuneCategory;
  name: string;
  amount: number;                // 원래 가격 (원)
  discountRate: number;         // 할인률 (0~100, 예: 10 = 10% 할인)
  finalAmount: number;          // 실제 결제 금액 (할인 적용 후, 원)
  description: string;
  duration?: number;            // 채팅형 세션 시간 (초) — 분 단위 상품
  /** 일 단위 채팅 이용권일 때만 설정 (1·7·30) */
  entitlementDays?: ChatEntitlementDays;
}

// 결제 준비 요청
export interface PreparePaymentRequest {
  productType: FortuneProductType;
  category: FortuneCategory;
  chatEntitlementDays?: ChatEntitlementDays;
  sessionId?: string;          // 기존 세션 연장 시
}
