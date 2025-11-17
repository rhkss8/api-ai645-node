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
  // TRADITIONAL
  [FortuneCategory.SAJU]: {
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
  [FortuneCategory.NEW_YEAR]: {
    name: '신년운세',
    chatGuidelines: `
- 새해 운세와 월별 상세 분석
- 올해의 주요 이벤트와 전환점
- 월별 운세 흐름과 주의사항
- 실천 가능한 조언 제공`,
    documentGuidelines: `
- 신년 운세 종합 분석
- 월별 운세 상세 설명
- 주요 전환점과 시기
- 월별 행동 가이드`,
    requiredInfo: '생년월일 정보 필요',
  },
  [FortuneCategory.MONEY]: {
    name: '횡재수 & 금전운',
    chatGuidelines: `
- 금전운과 횡재 가능성 분석
- 재물을 얻을 수 있는 시기와 방법
- 재물 관리와 운용 조언
- 주의해야 할 금전 관련 사항`,
    documentGuidelines: `
- 금전운 종합 분석
- 횡재 가능 시기와 방법
- 재물 관리 전략
- 주의사항 및 대응`,
  },
  [FortuneCategory.HAND]: {
    name: '손금',
    chatGuidelines: `
- 손금을 통한 재물운, 건강운, 애정운 분석
- 손금의 주요 선과 의미 해석
- 운세 흐름과 전망
- 실천 조언 제공`,
    documentGuidelines: `
- 손금 선별 상세 해석
- 재물운, 건강운, 애정운 분석
- 운세 전망과 시기
- 실천 가이드`,
    requiredInfo: '손금 사진 또는 설명',
  },
  [FortuneCategory.TOJEONG]: {
    name: '토정비결',
    chatGuidelines: `
- 조선시대 전통 운세 방법론 적용
- 토정비결의 원리와 해석
- 운세 흐름과 전망
- 실천 조언 제공`,
    documentGuidelines: `
- 토정비결 원리 설명
- 운세 종합 분석
- 시기별 운세 전망
- 실천 가이드`,
    requiredInfo: '생년월일 정보 필요',
  },
  
  // ASK
  [FortuneCategory.BREAK_UP]: {
    name: '헤어진 연인 재회',
    chatGuidelines: `
- 헤어진 연인과의 재회 가능성 분석
- 재회를 위한 시기와 방법
- 관계 회복 전략
- 현실적인 조언 제공`,
    documentGuidelines: `
- 재회 가능성 종합 분석
- 재회 시기와 방법
- 관계 회복 전략
- 주의사항 및 대응`,
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
  [FortuneCategory.INVESTMENT]: {
    name: '투자 상담',
    chatGuidelines: `
- 투자 시기와 방향성 분석
- 투자 아이템 적합성
- 리스크 관리 조언
- 수익 극대화 전략`,
    documentGuidelines: `
- 투자 운세 종합 분석
- 투자 시기와 방향
- 투자 아이템 추천
- 리스크 관리 방안`,
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
    name: '행운번호(로또)',
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
  [FortuneCategory.TRAVEL]: {
    name: '여행운 & 방향',
    chatGuidelines: `
- 여행 좋은 날짜와 방향 추천
- 여행지별 운세 분석
- 여행 중 주의사항
- 행운을 불러오는 여행 방법`,
    documentGuidelines: `
- 여행 길일 캘린더
- 방향별 추천 여행지
- 여행 중 주의사항
- 행운 여행 가이드`,
  },
  [FortuneCategory.COMPATIBILITY]: {
    name: '궁합',
    chatGuidelines: `
- 두 사람의 생년월일 정보 기반 궁합 분석
- 오행 균형과 상성 분석
- 관계 발전 전망
- 실천 조언 제공`,
    documentGuidelines: `
- 궁합 종합 분석
- 오행 상성 분석
- 관계 전망
- 실천 가이드`,
    requiredInfo: '두 사람의 생년월일 정보',
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
  
  // DAILY
  [FortuneCategory.DAILY]: {
    name: '오늘의 운세',
    chatGuidelines: `
- 오늘 하루의 종합 운세 분석
- 시간대별 운세 흐름
- 오늘 주의할 점과 행동 가이드
- 실천 가능한 조언 제공`,
    documentGuidelines: `
- 오늘의 운세 종합 분석
- 시간대별 운세
- 오늘의 행동 가이드
- 주의사항 및 대응`,
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
