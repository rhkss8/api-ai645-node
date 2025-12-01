/**
 * 사용자 입력에서 운세 주제 추출 유틸리티
 * 카테고리를 우선 활용하고, 필요시 사용자 입력에서 세부 주제를 추출
 */

import { FortuneCategory } from '../types/fortune';

export interface FortuneTopic {
  topics: string[]; // 추출된 주제 목록
  focusArea: string; // 집중 분석 영역
  isSpecific: boolean; // 특정 주제 질문 여부
}

/**
 * 카테고리별 기본 운세 주제 매핑
 */
const categoryToTopicMap: Record<FortuneCategory, string> = {
  [FortuneCategory.SAJU]: '종합 운세', // SAJU는 사용자 입력에서 세부 주제 추출 필요
  [FortuneCategory.NEW_YEAR]: '신년운세',
  [FortuneCategory.MONEY]: '재물운',
  [FortuneCategory.HAND]: '손금',
  [FortuneCategory.TOJEONG]: '토정비결',
  [FortuneCategory.BREAK_UP]: '연애운',
  [FortuneCategory.CAR_PURCHASE]: '차구매',
  [FortuneCategory.BUSINESS]: '사업운',
  [FortuneCategory.INVESTMENT]: '재물운',
  [FortuneCategory.LOVE]: '연애운',
  [FortuneCategory.DREAM]: '꿈해몽',
  [FortuneCategory.LUCKY_NUMBER]: '행운번호',
  [FortuneCategory.MOVING]: '이사운',
  [FortuneCategory.TRAVEL]: '여행운',
  [FortuneCategory.COMPATIBILITY]: '궁합',
  [FortuneCategory.TAROT]: '타로',
  [FortuneCategory.CAREER]: '직장운',
  [FortuneCategory.LUCKY_DAY]: '길일',
  [FortuneCategory.NAMING]: '작명',
  [FortuneCategory.DAILY]: '오늘의 운세',
};

/**
 * 카테고리에서 운세 주제 추출 (우선순위 1)
 */
export function extractTopicFromCategory(category: FortuneCategory): FortuneTopic {
  const defaultTopic = categoryToTopicMap[category];
  
  // SAJU는 사용자 입력에서 세부 주제를 추출해야 하므로 기본값만 반환
  if (category === FortuneCategory.SAJU) {
    return {
      topics: ['종합 운세'],
      focusArea: '종합 운세',
      isSpecific: false,
    };
  }

  return {
    topics: [defaultTopic],
    focusArea: defaultTopic,
    isSpecific: true,
  };
}

/**
 * 사용자 입력에서 운세 주제를 추출
 */
export function extractFortuneTopic(userInput: string): FortuneTopic {
  const input = userInput.toLowerCase().trim();

  // 운세 주제 키워드 매핑
  const topicKeywords: Record<string, string[]> = {
    재물운: ['재물', '재물운', '돈', '금전', '금전운', '횡재', '횡재수', '재산', '수입', '지출', '투자', '사업수익'],
    건강운: ['건강', '건강운', '질병', '병', '몸', '체력', '수명', '회복', '치료'],
    연애운: ['연애', '연애운', '사랑', '로맨스', '이성', '데이트', '결혼', '배우자', '애인'],
    직장운: ['직장', '직장운', '일', '업무', '승진', '이직', '커리어', '직업', '사업', '사업운'],
    인간관계: ['인간관계', '사람', '친구', '동료', '가족', '대인관계', '인맥'],
    성격: ['성격', '성향', '기질', '특성', '성품'],
    대운: ['대운', '인생', '전체', '종합', '올해', '올해운', '올해의 운'],
    학업운: ['학업', '학업운', '공부', '시험', '입시', '학력'],
    이사운: ['이사', '이사운', '이주', '이전', '거주지'],
    차구매: ['차', '자동차', '차구매', '차량', '구매'],
  };

  const foundTopics: string[] = [];
  let focusArea = '종합 운세'; // 기본값

  // 키워드 매칭
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        if (!foundTopics.includes(topic)) {
          foundTopics.push(topic);
        }
        // 첫 번째 매칭된 주제를 집중 영역으로 설정
        if (focusArea === '종합 운세') {
          focusArea = topic;
        }
      }
    }
  }

  // 특정 주제 질문 여부 판단
  const isSpecific = foundTopics.length > 0 && foundTopics.length <= 2;

  // 주제가 없으면 종합 운세로 처리
  if (foundTopics.length === 0) {
    return {
      topics: ['종합 운세'],
      focusArea: '종합 운세',
      isSpecific: false,
    };
  }

  return {
    topics: foundTopics,
    focusArea,
    isSpecific,
  };
}

/**
 * 카테고리와 사용자 입력을 결합하여 운세 주제 추출
 * 카테고리를 우선 활용하고, SAJU 같은 경우에만 사용자 입력에서 세부 주제 추출
 */
export function extractFortuneTopicFromCategoryAndInput(
  category: FortuneCategory,
  userInput: string,
): FortuneTopic {
  // 카테고리에서 기본 주제 추출
  const categoryTopic = extractTopicFromCategory(category);

  // SAJU가 아니면 카테고리 기반 주제 반환
  if (category !== FortuneCategory.SAJU) {
    return categoryTopic;
  }

  // SAJU인 경우: 사용자 입력에서 세부 주제 추출
  const inputTopic = extractFortuneTopic(userInput);
  
  // 사용자 입력에서 주제를 찾지 못했으면 종합 운세
  if (!inputTopic.isSpecific) {
    return categoryTopic;
  }

  // 사용자 입력에서 세부 주제를 찾았으면 그것을 사용
  return inputTopic;
}

/**
 * 분석 대상 문자열 생성
 */
export function generateAnalysisTarget(topics: string[], category?: FortuneCategory): string {
  // 카테고리 기반 분석 대상 매핑
  if (category && category !== FortuneCategory.SAJU) {
    const categoryTargets: Record<FortuneCategory, string> = {
      [FortuneCategory.MONEY]: '재물운, 횡재수, 금전 관리',
      [FortuneCategory.LOVE]: '연애운, 이성운, 결혼운',
      [FortuneCategory.CAREER]: '직장운, 승진, 이직, 사업운',
      [FortuneCategory.BUSINESS]: '사업운, 재물운, 투자',
      [FortuneCategory.INVESTMENT]: '투자운, 재물운, 금전 관리',
      [FortuneCategory.MOVING]: '이사운, 거주지, 직장운',
      [FortuneCategory.CAR_PURCHASE]: '차구매, 재물운, 안전운',
      [FortuneCategory.TRAVEL]: '여행운, 방향, 안전운',
      [FortuneCategory.COMPATIBILITY]: '궁합, 연애운, 인간관계',
      [FortuneCategory.TAROT]: '타로 카드 해석, 운세',
      [FortuneCategory.LUCKY_DAY]: '길일, 행운의 날, 시기',
      [FortuneCategory.NAMING]: '작명, 이름의 영향, 운세',
      [FortuneCategory.DREAM]: '꿈해몽, 꿈의 의미',
      [FortuneCategory.LUCKY_NUMBER]: '행운번호, 숫자의 의미',
      [FortuneCategory.BREAK_UP]: '연애운, 재회 가능성, 이성운',
      [FortuneCategory.NEW_YEAR]: '신년운세, 올해의 운, 월별 운세',
      [FortuneCategory.HAND]: '손금, 인생선, 운세',
      [FortuneCategory.TOJEONG]: '토정비결, 운세 해석',
      [FortuneCategory.DAILY]: '오늘의 운세, 일일 운세',
      [FortuneCategory.SAJU]: '성격, 올해의 운, 재물운, 건강운, 연애운, 직장운', // 기본값
    };

    return categoryTargets[category] || categoryTargets[FortuneCategory.SAJU];
  }

  // SAJU이거나 카테고리가 없는 경우: 사용자 입력 기반
  if (topics.length === 0 || (topics.length === 1 && topics[0] === '종합 운세')) {
    return '성격, 올해의 운, 재물운, 건강운, 연애운, 직장운';
  }

  // 특정 주제가 있으면 해당 주제 중심으로, 관련 주제도 포함
  const targetMap: Record<string, string[]> = {
    재물운: ['재물운', '직장운', '사업운'],
    건강운: ['건강운', '성격'],
    연애운: ['연애운', '인간관계', '성격'],
    직장운: ['직장운', '재물운', '인간관계'],
    인간관계: ['인간관계', '연애운', '직장운'],
    성격: ['성격', '인간관계', '연애운'],
    대운: ['대운', '올해의 운', '종합 운세'],
    학업운: ['학업운', '직장운'],
    이사운: ['이사운', '직장운', '재물운'],
    차구매: ['차구매', '재물운', '직장운'],
  };

  const analysisTargets: string[] = [];
  for (const topic of topics) {
    const related = targetMap[topic] || [topic];
    for (const t of related) {
      if (!analysisTargets.includes(t)) {
        analysisTargets.push(t);
      }
    }
  }

  return analysisTargets.join(', ');
}

