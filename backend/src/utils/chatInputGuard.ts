const PUNCT_OR_SPACE = /[\s\p{P}\p{S}]/gu;
const HANGUL_JAMO_ONLY = /^[ㄱ-ㅎㅏ-ㅣ]+$/;
const LATIN_ONLY = /^[a-z]+$/i;
const SAME_CHAR_REPEAT = /^(.)\1+$/;
const HAS_MEANINGFUL_SCRIPT = /[가-힣0-9\u4E00-\u9FFF]/u;

export function isMeaninglessChatInput(raw: string): boolean {
  const normalized = raw.trim();
  if (!normalized) return true;

  const compact = normalized.replace(PUNCT_OR_SPACE, '');
  if (!compact) return true;

  if (HANGUL_JAMO_ONLY.test(compact)) return true;
  if (SAME_CHAR_REPEAT.test(compact) && compact.length <= 6) return true;

  if (!HAS_MEANINGFUL_SCRIPT.test(compact)) {
    if (LATIN_ONLY.test(compact) && compact.length <= 4) return true;
    if (compact.length <= 3) return true;
  }

  return false;
}

export function buildMeaninglessChatResponse() {
  return {
    message: '질문을 이해하지 못했어요. 궁금한 내용을 조금 더 구체적으로 적어주세요.',
    nextQuestions: [
      '이번 달 흐름을 더 자세히 알려줘',
      '가장 조심해야 할 시기를 알려줘',
      '인간관계에서 특히 주의할 점이 뭐야?',
    ],
  };
}
