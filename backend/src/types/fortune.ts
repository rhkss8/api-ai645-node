/**
 * 포포춘(For Fortune) 운세 서비스 타입 정의
 */
import { ApiResponse } from './common';

// 운세 카테고리
export enum FortuneCategory {
  SASA = 'SASA',              // 사주
  TAROT = 'TAROT',            // 타로
  DREAM = 'DREAM',            // 꿈해몽
  LUCKY_NUMBER = 'LUCKY_NUMBER', // 행운번호(로또)
  LOVE = 'LOVE',              // 연애운
  CAREER = 'CAREER',          // 직장운
  BUSINESS = 'BUSINESS',      // 사업운
  LUCKY_DAY = 'LUCKY_DAY',    // 길일
  MOVING = 'MOVING',          // 이사
  CAR_PURCHASE = 'CAR_PURCHASE', // 차구매
  NAMING = 'NAMING',          // 작명
  NICKNAME = 'NICKNAME',      // 닉네임
}

// 세션 모드
export enum SessionMode {
  CHAT = 'CHAT',              // 채팅형
  DOCUMENT = 'DOCUMENT',      // 문서형
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
  mode: SessionMode;
  userInput: string;
  paymentId?: string;          // 즉시 결제 시 결제 ID (선택)
  useFreeHongsi?: boolean;     // 무료 홍시 사용 여부 (채팅형만)
}

// 세션 생성 응답
export interface CreateFortuneSessionResponse {
  sessionId: string;
  category: FortuneCategory;
  mode: SessionMode;
  remainingTime: number;
  isActive: boolean;
  expiresAt: string;
  isPaid: boolean;             // 결제 여부
}

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