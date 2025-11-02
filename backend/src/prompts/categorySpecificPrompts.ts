/**
 * 카테고리별 특화 프롬프트 템플릿
 */
import { FortuneCategory } from '../types/fortune';

export const categoryGuidelines: Record<FortuneCategory, {
  name: string;
  chatGuidelines: string;
  documentGuidelines: string;
  requiredInfo?: string;
}> = {
  [FortuneCategory.SASA]: {
    name: '사주',
    chatGuidelines: `
- 사용자의 생년월일시(사주팔자) 정보를 바탕으로 분석
- 오행(金木水火土) 균형, 용신, 신살 등을 고려
- 대운, 세운, 월운 등의 흐름 설명
- 친근하고 이해하기 쉽게 설명`,
    documentGuidelines: `
- 사주명식 구성 설명
- 오행 분석 및 균형 상태
- 용신과 기신 분석
- 대운 흐름 및 시기별 운세
- 실천 조언`,
    requiredInfo: '생년월일시 정보 필요',
  },
  [FortuneCategory.TAROT]: {
    name: '타로',
    chatGuidelines: `
- 선택된 카드의 의미와 상징 해석
- 현재 상황, 과거 배경, 미래 전망으로 구성
- 카드 조합의 시너지 분석
- 실천 가능한 조언 제공`,
    documentGuidelines: `
- 카드별 상세 해석
- 카드 조합 의미
- 과거-현재-미래 흐름
- 행동 방향성 제시`,
    requiredInfo: '뽑은 타로 카드 정보',
  },
  [FortuneCategory.DREAM]: {
    name: '꿈해몽',
    chatGuidelines: `
- 꿈속 등장인물, 상황, 색깔 등을 종합 분석
- 꿈의 상징적 의미 해석
- 심리적 배경과 연결
- 현실에서의 시사점 제공`,
    documentGuidelines: `
- 꿈의 주요 요소별 해석
- 상징적 의미 분석
- 심리적 배경 설명
- 현실 반영 조언`,
    requiredInfo: '꿈의 상세 내용',
  },
  [FortuneCategory.LUCKY_NUMBER]: {
    name: '행운번호',
    chatGuidelines: `
- 생년월일, 이름 등 개인 정보 기반 번호 추천
- 최근 운세 흐름 반영
- 홀짝 비율, 구간 분포 고려
- 번호 선택 이유 설명`,
    documentGuidelines: `
- 개인정보 기반 번호 분석
- 추천 번호 세트 제시
- 각 번호 선택 이유
- 사용 시기 및 주의사항`,
    requiredInfo: '생년월일 또는 이름',
  },
  [FortuneCategory.LOVE]: {
    name: '연애운',
    chatGuidelines: `
- 현재 연애 상황 분석
- 만남의 가능성, 관계 발전 전망
- 타이밍과 방법론 제시
- 자기계발 조언 포함`,
    documentGuidelines: `
- 연애운 종합 분석
- 만남의 시기와 방법
- 관계 발전 전망
- 자기계발 포인트`,
  },
  [FortuneCategory.CAREER]: {
    name: '직장운',
    chatGuidelines: `
- 직장 내 상황 및 관계 분석
- 승진, 이직, 프로젝트 성공 가능성
- 능력 발휘 시기와 방법
- 주의할 점과 대응 방안`,
    documentGuidelines: `
- 직장운 종합 분석
- 시기별 주요 이벤트 전망
- 능력 발휘 전략
- 주의사항 및 대응`,
  },
  [FortuneCategory.BUSINESS]: {
    name: '사업운',
    chatGuidelines: `
- 사업 아이템, 타이밍, 파트너 분석
- 매출, 확장 가능성 전망
- 리스크 관리 조언
- 성공을 위한 실천 사항`,
    documentGuidelines: `
- 사업운 종합 분석
- 사업 아이템 적합성
- 타이밍과 전략
- 리스크 관리 방안`,
  },
  [FortuneCategory.LUCKY_DAY]: {
    name: '길일',
    chatGuidelines: `
- 중요한 일정의 좋은 날짜 추천
- 금기일 회피 및 길일 선택
- 일정별 적합한 날짜 안내
- 대안 날짜 제시`,
    documentGuidelines: `
- 길일 캘린더 제공
- 일정별 추천 날짜
- 금기일 안내
- 월별 길일 요약`,
    requiredInfo: '중요 일정 정보',
  },
  [FortuneCategory.MOVING]: {
    name: '이사',
    chatGuidelines: `
- 이사 좋은 날짜 추천
- 방위와 시간대 고려
- 금기일 회피 안내
- 이사 후 안정을 위한 조언`,
    documentGuidelines: `
- 이사 길일 캘린더
- 방위별 추천 날짜
- 시간대별 안내
- 이사 후 조치 사항`,
    requiredInfo: '이사 목적지 정보',
  },
  [FortuneCategory.CAR_PURCHASE]: {
    name: '차구매',
    chatGuidelines: `
- 차 구매 좋은 날짜 추천
- 차종, 색깔 운세 연계
- 구매 후 운행 주의사항
- 행운을 불러오는 방법`,
    documentGuidelines: `
- 차구매 길일 추천
- 차종별 운세 분석
- 구매 후 조치 사항
- 행운 기원 방법`,
  },
  [FortuneCategory.NAMING]: {
    name: '작명',
    chatGuidelines: `
- 생년월일시 기반 작명
- 오행 균형 고려
- 좋은 의미와 발음
- 한자 의미 설명`,
    documentGuidelines: `
- 작명 원칙 설명
- 추천 이름 제시
- 각 이름의 의미 분석
- 최종 추천 이름`,
    requiredInfo: '생년월일시 정보',
  },
  [FortuneCategory.NICKNAME]: {
    name: '닉네임',
    chatGuidelines: `
- 개성과 운세를 반영한 닉네임 추천
- 사용 목적별 추천
- 각 닉네임의 의미와 효과
- 선택 가이드 제공`,
    documentGuidelines: `
- 닉네임 추천 원칙
- 목적별 추천 리스트
- 각 닉네임 의미 분석
- 선택 가이드`,
  },
};

/**
 * 카테고리별 특화 채팅 프롬프트 생성
 */
export function getCategorySpecificChatPrompt(category: FortuneCategory): string {
  const guideline = categoryGuidelines[category];
  
  let prompt = `
## ${guideline.name} 상담 특화 가이드:
${guideline.chatGuidelines}`;

  if (guideline.requiredInfo) {
    prompt += `\n\n⚠️ 필수 정보: ${guideline.requiredInfo}`;
  }

  return prompt;
}

/**
 * 카테고리별 특화 문서 프롬프트 생성
 */
export function getCategorySpecificDocumentPrompt(category: FortuneCategory): string {
  const guideline = categoryGuidelines[category];
  
  let prompt = `
## ${guideline.name} 리포트 특화 가이드:
${guideline.documentGuidelines}`;

  if (guideline.requiredInfo) {
    prompt += `\n\n⚠️ 필수 정보: ${guideline.requiredInfo}`;
  }

  return prompt;
}
