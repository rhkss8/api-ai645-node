import { ChatResponse, DocumentResponse, isChatResponseV2 } from '../types/fortune';

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/학습과 전문성 강화:?/gi, '실력을 키우는 흐름:'],
  [/재정 관리와 투자 전략:?/gi, '돈 흐름 관리 포인트:'],
  [/있사오니/gi, '있고'],
  [/이르러서는/gi, '되면'],
  [/이르러서/gi, '되면'],
  [/하오니/gi, '하니'],
];

function removeRepeatedPersonalAddress(text: string): string {
  return text
    .replace(/(^|\n+)([가-힣A-Za-z0-9]{2,12}) 님의 /g, '$1')
    .replace(/(^|\n+)([가-힣A-Za-z0-9]{2,12}) 님은 /g, '$1')
    .replace(/(^|\n+)([가-힣A-Za-z0-9]{2,12}) 님께서는 /g, '$1');
}

function paragraphizeLongProse(text: string): string {
  if (!text || text.includes('\n\n')) {
    return text;
  }

  const sentences = text
    .split(/(?<=[.!?]|다\.)\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length < 4) {
    return text;
  }

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(' '));
  }

  return paragraphs.join('\n\n');
}

function normalizeLineCopy(text: string): string {
  let normalized = text;

  normalized = normalized
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^\s*#+\s*/gm, '');

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  normalized = normalized
    .replace(/\s{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  normalized = removeRepeatedPersonalAddress(normalized);
  normalized = paragraphizeLongProse(normalized);

  return normalized;
}

export function normalizeDocumentResponseCopy(response: DocumentResponse): DocumentResponse {
  return {
    ...response,
    title: normalizeLineCopy(response.title),
    summary: normalizeLineCopy(response.summary),
    content: normalizeLineCopy(response.content),
    advice: response.advice.map((item) => normalizeLineCopy(item)),
    warnings: response.warnings.map((item) => normalizeLineCopy(item)),
    chatPrompt: normalizeLineCopy(response.chatPrompt),
  };
}

export function normalizeChatResponseCopy(response: ChatResponse): ChatResponse {
  if (isChatResponseV2(response)) {
    return {
      ...response,
      message: normalizeLineCopy(response.message),
      nextQuestions: (response.nextQuestions || []).map((item) => normalizeLineCopy(item)),
    };
  }

  return {
    ...response,
    summary: normalizeLineCopy(response.summary),
    points: response.points.map((item) => normalizeLineCopy(item)),
    tips: response.tips.map((item) => normalizeLineCopy(item)),
    disclaimer: normalizeLineCopy(response.disclaimer),
    nextQuestions: (response.nextQuestions || []).map((item) => normalizeLineCopy(item)),
  };
}
