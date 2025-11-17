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
  FREE = 'FREE',              // 무료 홍시 (1일 1회, 2분)
  MINUTES_5 = 'MINUTES_5',    // 5분
  MINUTES_10 = 'MINUTES_10',  // 10분
  MINUTES_30 = 'MINUTES_30',  // 30분
}

// 채팅형 운세 응답
export interface ChatResponse {
  summary: string;
  points: string[];
  tips: string[];
  disclaimer: string;
  suggestPayment?: boolean;  // 결제 연장 제안 여부
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
  durationMinutes?: number;    // 채팅형 유료 결제 시 필수 (5/10/30)
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
  isPaid: boolean;             // 결제 여부
}

// 에러 코드 표준
export type FortuneErrorCode =
  | 'NEED_PAYMENT'
  | 'HONGSI_ALREADY_USED'
  | 'SESSION_EXPIRED'
  | 'CATEGORY_MISMATCH'
  | 'TOKEN_INVALID'
  | 'PAYMENT_UNVERIFIED'
  | 'INVALID_FORMTYPE';

// 채팅형 시간 옵션 (분 단위)
export enum ChatDurationMinutes {
  MINUTES_5 = 5,
  MINUTES_10 = 10,
  MINUTES_30 = 30,
}

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
  duration?: number;            // 채팅형 세션 시간 (초)
}

// 결제 준비 요청
export interface PreparePaymentRequest {
  productType: FortuneProductType;
  category: FortuneCategory;
  durationMinutes?: number;     // 채팅형일 경우 시간 (5, 10, 30분)
  sessionId?: string;          // 기존 세션 연장 시
}