/**
 * 카테고리 이탈 감지 유틸리티
 */
import { FortuneCategory } from '../types/fortune';

const categoryKeywords: Record<FortuneCategory, string[]> = {
  // TRADITIONAL
  [FortuneCategory.SAJU]: ['사주', '사주명리', '생년월일', '시간', '오행', '팔자'],
  [FortuneCategory.NEW_YEAR]: ['신년', '신년운세', '새해', '올해운세'],
  [FortuneCategory.MONEY]: ['횡재', '금전', '재물', '돈', '수익'],
  [FortuneCategory.HAND]: ['손금', '손금보기', '손선'],
  [FortuneCategory.TOJEONG]: ['토정비결', '토정'],
  
  // ASK
  [FortuneCategory.BREAK_UP]: ['헤어진', '재회', '전남친', '전여친', '이별'],
  [FortuneCategory.CAR_PURCHASE]: ['차', '자동차', '차구매', '구매', '차량'],
  [FortuneCategory.BUSINESS]: ['사업', '창업', '영업', '매출', '수익'],
  [FortuneCategory.INVESTMENT]: ['투자', '주식', '부동산', '펀드'],
  [FortuneCategory.LOVE]: ['연애', '사랑', '애정', '커플', '연인', '남친', '여친'],
  [FortuneCategory.DREAM]: ['꿈', '꿈해몽', '해몽', '꿈속'],
  [FortuneCategory.LUCKY_NUMBER]: ['번호', '행운번호', '로또', '번호추천', '복권'],
  [FortuneCategory.MOVING]: ['이사', '이전', '이주', '집'],
  [FortuneCategory.TRAVEL]: ['여행', '방향', '여행지', '여행운'],
  [FortuneCategory.COMPATIBILITY]: ['궁합', '상성', '궁합보기'],
  [FortuneCategory.TAROT]: ['타로', '카드', '타롯', '타로카드'],
  [FortuneCategory.CAREER]: ['직장', '직업', '승진', '취업', '일', '회사'],
  [FortuneCategory.LUCKY_DAY]: ['길일', '좋은날', '행운의날', '날짜'],
  [FortuneCategory.NAMING]: ['작명', '이름', '이름지어', '명명'],
  
  // DAILY
  [FortuneCategory.DAILY]: ['오늘', '오늘의운세', '오늘운세', '하루'],
};

/**
 * 사용자 입력에서 카테고리 키워드 감지
 */
export function detectCategoryFromInput(userInput: string): FortuneCategory | null {
  const input = userInput.toLowerCase();
  
  // 각 카테고리별 점수 계산
  const scores: Partial<Record<FortuneCategory, number>> = {};
  
  // 모든 카테고리 점수 초기화
  Object.values(FortuneCategory).forEach(category => {
    scores[category] = 0;
  });

  // 키워드 매칭 점수 계산
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        scores[category as FortuneCategory] = (scores[category as FortuneCategory] || 0) + 1;
      }
    }
  }

  // 가장 높은 점수의 카테고리 반환
  const maxScore = Math.max(...Object.values(scores).filter(v => v !== undefined) as number[]);
  if (maxScore === 0) {
    return null; // 매칭되는 카테고리 없음
  }

  const detectedCategory = Object.entries(scores).find(
    ([, score]) => score === maxScore,
  )?.[0] as FortuneCategory;

  return detectedCategory;
}

/**
 * 카테고리 이탈 여부 확인
 */
export function isCategoryMismatch(
  currentCategory: FortuneCategory,
  userInput: string,
): boolean {
  const detectedCategory = detectCategoryFromInput(userInput);
  
  if (!detectedCategory) {
    return false; // 카테고리 감지 실패 시 현재 카테고리 유지
  }

  return detectedCategory !== currentCategory;
}

/**
 * 관련 카테고리 제안 생성
 */
export function getSuggestedCategories(
  currentCategory: FortuneCategory,
  limit: number = 3,
): FortuneCategory[] {
  // 현재 카테고리를 제외한 모든 카테고리
  const allCategories = Object.values(FortuneCategory);
  const otherCategories = allCategories.filter(c => c !== currentCategory);
  
  // 랜덤하게 섞기 (실제로는 추천 알고리즘 사용 가능)
  const shuffled = otherCategories.sort(() => Math.random() - 0.5);
  
  return shuffled.slice(0, limit);
}
