/**
 * 이전 대화 로그로부터 AI 컨텍스트용 문자열을 슬림하게 구성합니다.
 * - 초기 가이드(userInput === '') 제외
 * - 최근 N턴, 총 문자 수 상한 적용
 * - aiOutput은 message/summary 1문장만 사용 (V1/V2 호환)
 */

export interface PreviousContextLog {
  userInput: string;
  aiOutput: string;
}

export interface BuildPreviousContextOptions {
  /** 최근 N턴만 사용 (기본 5) */
  maxTurns?: number;
  /** 전체 문자열 최대 문자 수 (초과 시 앞쪽 턴부터 잘림) */
  maxChars?: number;
  /** true면 aiOutput 전체 대신 message 또는 summary 1문장만 사용 (기본 true) */
  aiOutputSummaryOnly?: boolean;
  /** summary/message 없을 때 사용할 최대 문자 수 (기본 200) */
  fallbackSnippetLength?: number;
}

const DEFAULT_MAX_TURNS = 5;
const DEFAULT_FALLBACK_SNIPPET_LENGTH = 200;

/**
 * aiOutput(JSON 문자열 또는 객체)에서 컨텍스트용 1문장만 추출.
 * V2: message, V1: summary. 없으면 앞 N자 잘라서 반환.
 */
function extractSummaryFromAiOutput(
  aiOutput: string,
  fallbackLength: number,
): string {
  let parsed: { message?: string; summary?: string } | null = null;
  try {
    parsed = typeof aiOutput === 'string' ? JSON.parse(aiOutput) : aiOutput;
  } catch {
    return aiOutput.length > fallbackLength
      ? aiOutput.slice(0, fallbackLength) + '…'
      : aiOutput;
  }
  if (!parsed || typeof parsed !== 'object') {
    const raw = String(aiOutput);
    return raw.length > fallbackLength ? raw.slice(0, fallbackLength) + '…' : raw;
  }
  if (typeof (parsed as any).message === 'string') {
    return (parsed as any).message;
  }
  if (typeof (parsed as any).summary === 'string') {
    return (parsed as any).summary;
  }
  const raw = String(aiOutput);
  return raw.length > fallbackLength ? raw.slice(0, fallbackLength) + '…' : raw;
}

/**
 * 이전 대화 로그 배열을 받아, AI 프롬프트용 previousContext 문자열을 반환합니다.
 * - userInput === '' 인 행(초기 가이드)은 제외
 * - 최근 maxTurns개 턴만 사용
 * - aiOutputSummaryOnly면 message/summary만 사용
 * - maxChars를 넘으면 앞쪽 턴부터 잘라서 맞춤
 */
export function buildPreviousContextForAI(
  logs: PreviousContextLog[],
  options: BuildPreviousContextOptions = {},
): string {
  const maxTurns = options.maxTurns ?? DEFAULT_MAX_TURNS;
  const maxChars = options.maxChars;
  const aiOutputSummaryOnly = options.aiOutputSummaryOnly !== false;
  const fallbackLength = options.fallbackSnippetLength ?? DEFAULT_FALLBACK_SNIPPET_LENGTH;

  const filtered = logs.filter(log => log.userInput !== '');
  const recent = filtered.slice(-maxTurns);

  const parts = recent.map(log => {
    const q = log.userInput;
    const a = aiOutputSummaryOnly
      ? extractSummaryFromAiOutput(log.aiOutput, fallbackLength)
      : log.aiOutput;
    return `Q: ${q}\nA: ${a}`;
  });

  let result = parts.join('\n\n');
  if (typeof maxChars === 'number' && result.length > maxChars) {
    const truncated: string[] = [];
    let total = 0;
    for (const p of parts) {
      if (total + p.length + 2 <= maxChars) {
        truncated.push(p);
        total += p.length + 2;
      } else {
        const remaining = maxChars - total - 4;
        if (remaining > 20) {
          truncated.push(p.slice(0, remaining) + '…');
        }
        break;
      }
    }
    result = truncated.join('\n\n');
  }
  return result;
}
