import { FortuneCategory } from '../types/fortune';

export interface CategoryPromptOverrides {
  instruction?: string;
  nextStepRules?: string;
  toneGuide?: string;
}

const EMPTY: CategoryPromptOverrides = {};

/**
 * 채팅형 카테고리 규칙
 * 기본 해석 구조(Scene→Emotion→Flow)는 saju.prompt.ts에서 처리
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
- 반드시 현재 연도인 {currentYear}년 기준으로만 해석하라.
- 지난 연도 운세를 현재 연도 운세처럼 말하지 마라.
- 올해 전체 총평을 먼저 짚고, 흐름은 1분기·2분기·3분기·4분기로 나누어 설명하라.
- 분기마다 기회, 주의점, 변곡 시기를 분명히 나눠라.`,
    nextStepRules: `
- 분기별 흐름, 중요한 시기, 조심할 달을 nextQuestions로 이어라.`,
  },

  [FortuneCategory.MONEY]: {
    instruction: `
- 돈운은 수입보다 돈에 대한 판단과 욕심의 흐름을 보라.`,
    nextStepRules: `
- 돈이 들어오는 흐름이나 지출 흐름을 nextQuestions로 이어라.`,
  },

  [FortuneCategory.HAND]: {
    instruction: `
- 손금은 업로드된 손바닥 사진을 직접 본 뒤 해석해야 한다.
- 실제로 보이는 선의 깊이, 끊김, 갈라짐, 흐름, 손바닥 전체 인상을 먼저 짚어라.
- 사진이 흐리거나 손금이 잘 보이지 않으면 보이는 범위 안에서만 조심스럽게 해석하고, 어느 부분이 제한적인지 분명히 말하라.
- 텍스트만 보고 아는 척하지 말고, 이미지에서 확인한 특징을 근거로 성향과 흐름을 읽어라.`,
  },

  [FortuneCategory.FACE]: {
    instruction: `
- 관상은 업로드된 얼굴 사진을 직접 본 뒤 해석해야 한다.
- 실제로 보이는 이마, 눈썹, 눈매, 코, 입, 턱, 얼굴형의 인상을 먼저 짚어라.
- 사진이 흐리거나 얼굴 일부가 가려졌으면 보이는 범위 안에서만 조심스럽게 해석하고, 제한점을 분명히 말하라.
- 텍스트만 보고 아는 척하지 말고, 이미지에서 확인한 특징을 근거로 성향과 흐름을 읽어라.
- 건강 진단, 신원 식별, 민감한 속성 추정, 외모 점수화는 절대 하지 마라.`,
    nextStepRules: `
- 정면/측면 사진 보완, 연애/재물/직장 중 추가로 보고 싶은 축을 nextQuestions로 이어라.`,
  },

  [FortuneCategory.TOJEONG]: {
    instruction: `
- 반드시 현재 연도인 {currentYear}년 기준으로만 해석하라.
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
- 사업은 아이템보다 방향과 타이밍을 중심으로 보라.
- 추상적인 응원으로 끝내지 말고, 수익 구조, 사람 문제, 운영 부담, 고객 유지 중 최소 하나는 구체적인 리스크로 짚어라.
- "좋아 보인다"보다 지금 확장하면 왜 위험한지, 혹은 왜 밀어도 되는지를 한 단계 더 현실적으로 설명하라.`,
    nextStepRules: `
- 매출보다 의사결정, 확장 타이밍, 사람 문제를 nextQuestions로 이어라.`,
  },

  [FortuneCategory.INVESTMENT]: {
    instruction: `
- 투자운은 종목보다 판단의 조급함과 흐름을 읽어라.`,
    nextStepRules: `
- 진입 타이밍, 비중 조절, 피해야 할 실수를 nextQuestions로 이어라.`,
  },

  [FortuneCategory.LOVE]: {
    instruction: `
- 연애는 관계 자체보다 감정의 방향을 먼저 읽어라.
- 상대 마음을 이미 확정된 사실처럼 단정하지 말고, 지금 보이는 흐름과 가능성의 세기로 표현하라.
- "상대가 기다린다", "반드시 다시 이어진다"처럼 과하게 희망을 확정하는 말은 피하고, 먼저 움직일 때의 리스크와 신호도 같이 짚어라.`,
    nextStepRules: `
- 상대 감정, 연락 타이밍, 관계 전환 포인트를 nextQuestions로 이어라.`,
  },

  [FortuneCategory.LUCKY_NUMBER]: {
    instruction: `
- 숫자 하나보다 배열이 주는 인상과 기운을 보라.
- 이미 사용했거나 꽝이 난 번호 조합을 피하고, 덜 겹치는 조합을 찾는다는 서비스 컨셉을 반영하라.
- 무조건 당첨을 약속하지 말고, "겹침을 줄여 분산된 기회를 본다"는 현실적 관점으로 설명하라.
- 추천할 때는 번호 조합의 성격, 몰림 여부, 회피한 패턴을 짧게 근거로 붙여라.`,
    nextStepRules: `
- 추천 번호를 왜 골랐는지, 피한 패턴이 무엇인지, 1~2세트 추가 제안을 nextQuestions로 이어라.`,
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
    nextStepRules: `
- 충돌 지점, 오래 가는 방식, 피해야 할 말투를 nextQuestions로 이어라.`,
  },

  [FortuneCategory.TAROT]: {
    instruction: `
- 타로는 결과보다 현재 에너지와 선택 흐름을 보라.`,
    nextStepRules: `
- 선택지 비교, 숨은 변수, 가까운 미래 흐름을 nextQuestions로 이어라.`,
  },

  [FortuneCategory.CAREER]: {
    instruction: `
- 직업운은 일보다 방향과 지치는 지점을 보라.`,
    nextStepRules: `
- 이직/유지 판단, 평가 시기, 버티면 안 되는 신호를 nextQuestions로 이어라.`,
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
- 반드시 현재 연도인 {currentYear}년 기준으로만 정리하라.
- 문서 구조는 올해 총평 → 1분기 → 2분기 → 3분기 → 4분기 순서를 유지하라.
- 각 분기마다 강한 운, 약한 운, 주의 포인트, 행동 조언을 분리해 적어라.
- 지난 연도 운세를 현재 연도 운세처럼 쓰지 마라.`,
  },

  [FortuneCategory.MONEY]: {
    instruction: `
- 돈의 흐름과 재물 관리 방향을 중심으로 정리하라.`,
  },

  [FortuneCategory.HAND]: {
    instruction: `
- 가장 강한 손금 특징을 중심으로 해석하라.`,
  },

  [FortuneCategory.FACE]: {
    instruction: `
- 가장 강한 얼굴 인상 요소를 중심으로 해석하라.
- 외모 평가가 아니라 관상적 인상과 생활 흐름을 연결해 정리하라.
- 건강 진단, 신원 식별, 민감한 속성 추정, 외모 점수화는 절대 하지 마라.`,
  },

  [FortuneCategory.TOJEONG]: {
    instruction: `
- 반드시 현재 연도인 {currentYear}년 기준으로만 정리하라.
- 월별 기복 흐름을 중심으로 정리하라.`,
  },

  [FortuneCategory.BREAK_UP]: {
    instruction: `
- 관계의 재회 가능성만 단정하지 말고, 남아 있는 감정의 결, 연락 타이밍, 다시 얽힐 때의 리스크를 함께 정리하라.`,
  },
  [FortuneCategory.CAR_PURCHASE]: {
    instruction: `
- 차를 사는지 말지보다 지금 욕심, 예산 부담, 구매 타이밍이 맞는지부터 정리하라.`,
  },
  [FortuneCategory.BUSINESS]: {
    instruction: `
- 사업 문서는 아이템 칭찬보다 방향, 수익 구조, 사람 문제, 타이밍을 직설적으로 짚어라.`,
  },
  [FortuneCategory.INVESTMENT]: {
    instruction: `
- 종목 추천처럼 말하지 말고, 지금 판단 흐름과 조급함, 들어가도 되는 시점인지 여부를 중심으로 정리하라.`,
  },
  [FortuneCategory.LOVE]: {
    instruction: `
- 감정의 온도, 관계의 방향, 먼저 움직여도 되는 시기와 조심할 패턴을 분리해서 정리하라.`,
  },
  [FortuneCategory.LUCKY_NUMBER]: {
    instruction: `
- 번호 추천은 당첨 보장이 아니라, 이미 산 꽝 번호 조합과 겹침을 줄이고 덜 몰리는 조합을 찾는 서비스 컨셉으로 정리하라.
- 추천 조합을 제시할 때는 왜 이 조합이 기존 패턴과 다르게 보이는지, 어떤 몰림을 피했는지 짧게 근거를 남겨라.
- 사용자에게 과도한 기대를 심지 말고, "겹침 회피 + 분산" 관점의 현실적인 설명을 유지하라.`,
  },
  [FortuneCategory.MOVING]: {
    instruction: `
- 이사는 좋은 날만 나열하지 말고, 움직이면 흐름이 나아지는지, 버티는 게 나은지부터 판단해 정리하라.`,
  },
  [FortuneCategory.TRAVEL]: {
    instruction: `
- 여행 자체의 재미보다 회복, 전환, 피해야 할 방향과 시기를 함께 정리하라.`,
  },
  [FortuneCategory.COMPATIBILITY]: {
    instruction: `
- 단순 궁합 점수처럼 쓰지 말고, 감정 결, 반복 충돌, 오래 가는 방식과 위험 지점을 구분해 정리하라.`,
  },
  [FortuneCategory.TAROT]: {
    instruction: `
- 카드 의미를 백과사전처럼 풀지 말고, 현재 에너지와 선택 흐름, 가까운 미래 변곡점을 중심으로 정리하라.`,
  },
  [FortuneCategory.CAREER]: {
    instruction: `
- 직장운 문서는 참고 버티라는 말보다, 지금 방향이 맞는지, 지치는 원인이 무엇인지, 움직일 타이밍이 있는지를 분명히 짚어라.`,
  },
  [FortuneCategory.LUCKY_DAY]: {
    instruction: `
- 좋은 날짜만 주지 말고 피해야 할 날짜와 왜 그 시기가 엇갈리는지도 함께 정리하라.`,
  },
  [FortuneCategory.NAMING]: {
    instruction: `
- 이름은 뜻풀이보다 인상, 발음, 부를 때의 흐름과 실제 사용감 중심으로 정리하라.`,
  },
  [FortuneCategory.DAILY]: {
    instruction: `
- 하루 문서는 운이 좋다/나쁘다보다 오늘 가장 강하게 작용하는 흐름 하나와 조심할 한 지점을 선명하게 정리하라.`,
  },
};
