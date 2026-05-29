import {
  DocumentChatBridgeContext,
  DocumentChatFollowupRule,
  DocumentChatTopicCard,
  DocumentResponse,
  FortuneCategory,
} from '../types/fortune';

function normalizeText(value: string, maxLength = 280): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function sliceParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractQuarterBlock(content: string, quarter: '1분기' | '2분기' | '3분기' | '4분기'): string | null {
  const escaped = quarter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(
    new RegExp(`${escaped}[\\s\\S]*?(?=(?:\\n\\n(?:1분기|2분기|3분기|4분기))|$)`, 'm'),
  );

  return match?.[0]?.trim() || null;
}

function uniqueQuestions(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))].slice(0, 5);
}

export class DocumentChatBridgeBuilder {
  build(params: {
    category: FortuneCategory;
    userInput: string;
    userData?: Record<string, any>;
    document: DocumentResponse;
  }): DocumentChatBridgeContext {
    const { category, userInput, document } = params;
    const paragraphs = sliceParagraphs(document.content);
    const intro = paragraphs[0] || document.summary;
    const detail = paragraphs[1] || document.content;

    const topicCards = this.buildTopicCards(category, document, paragraphs);
    const riskNotes = uniqueQuestions([
      ...document.warnings.map((item) => normalizeText(item, 180)),
      ...topicCards.flatMap((card) => card.watchouts),
    ]).slice(0, 6);

    return {
      anchorSummary: normalizeText(
        `${document.summary} 사용자는 "${userInput}" 맥락에서 이 문서를 바탕으로 더 구체적인 상담을 기대하고 있다.`,
        420,
      ),
      topicCards,
      followupMap: this.buildFollowupMap(category),
      riskNotes: riskNotes.length > 0 ? riskNotes : [normalizeText(detail, 180)],
    };
  }

  private buildTopicCards(
    category: FortuneCategory,
    document: DocumentResponse,
    paragraphs: string[],
  ): DocumentChatTopicCard[] {
    const baseCards: DocumentChatTopicCard[] = [
      {
        topic: 'overall',
        summary: normalizeText(document.summary, 220),
        signals: [normalizeText(paragraphs[0] || document.content, 240)],
        watchouts: document.warnings.slice(0, 2).map((item) => normalizeText(item, 180)),
        openLoops: [
          '문서에서 가장 강하게 본 흐름이 실제 상황과 어떻게 맞물리는지 추가 확인이 필요하다.',
        ],
        recommendedQuestions: uniqueQuestions([
          document.chatPrompt,
          '지금 제일 먼저 조심해야 할 포인트가 뭐예요?',
          '이 흐름이 실제로 언제부터 강해지나요?',
        ]),
      },
    ];

    if (category === 'NEW_YEAR') {
      const quarterCards = (['1분기', '2분기', '3분기', '4분기'] as const)
        .map((quarter) => {
          const block = extractQuarterBlock(document.content, quarter);
          if (!block) return null;

          return {
            topic: quarter,
            summary: normalizeText(block, 220),
            signals: [normalizeText(block, 240)],
            watchouts: document.warnings.slice(0, 2).map((item) => normalizeText(item, 180)),
            openLoops: [`${quarter}에 실제로 어떤 선택을 해야 흐름을 살릴 수 있는지 추가 확인이 필요하다.`],
            recommendedQuestions: uniqueQuestions([
              `${quarter}에 가장 조심해야 할 건 뭐예요?`,
              `${quarter}에 기회가 오는 시점은 언제예요?`,
            ]),
          } satisfies DocumentChatTopicCard;
        })
        .filter(Boolean) as DocumentChatTopicCard[];

      return [
        ...baseCards,
        {
          topic: 'timing',
          summary: normalizeText(
            [
              extractQuarterBlock(document.content, '1분기'),
              extractQuarterBlock(document.content, '2분기'),
              extractQuarterBlock(document.content, '3분기'),
              extractQuarterBlock(document.content, '4분기'),
            ]
              .filter(Boolean)
              .join(' '),
            260,
          ),
          signals: quarterCards.slice(0, 2).map((card) => card.summary),
          watchouts: document.warnings.slice(0, 3).map((item) => normalizeText(item, 180)),
          openLoops: ['올해 흐름 중 어떤 분기가 실제 체감과 가장 가까운지 채팅에서 좁혀봐야 한다.'],
          recommendedQuestions: uniqueQuestions([
            '올해는 어느 분기가 제일 중요해요?',
            '지금 제 상황이면 어느 분기에 승부를 봐야 할까요?',
          ]),
        },
        ...quarterCards,
      ];
    }

    return [
      ...baseCards,
      {
        topic: 'timing',
        summary: normalizeText(paragraphs.slice(1, 3).join(' '), 240),
        signals: document.advice.slice(0, 2).map((item) => normalizeText(item, 180)),
        watchouts: document.warnings.slice(0, 2).map((item) => normalizeText(item, 180)),
        openLoops: ['좋은 흐름이 언제 강해지고 약해지는지 세부 시점 확인이 필요하다.'],
        recommendedQuestions: uniqueQuestions([
          '언제가 가장 중요한 시기예요?',
          '지금 바로 움직여도 되는 흐름인가요?',
        ]),
      },
      {
        topic: 'risk',
        summary: normalizeText(document.warnings.join(' '), 220),
        signals: document.warnings.slice(0, 3).map((item) => normalizeText(item, 180)),
        watchouts: document.warnings.slice(0, 3).map((item) => normalizeText(item, 180)),
        openLoops: ['위험 신호가 실제 현재 상황과 얼마나 맞물리는지 구체화가 필요하다.'],
        recommendedQuestions: uniqueQuestions([
          '지금 가장 조심해야 할 리스크는 뭐예요?',
          '이건 피할 수 있는 흐름인가요?',
        ]),
      },
    ];
  }

  private buildFollowupMap(category: FortuneCategory): DocumentChatFollowupRule[] {
    const baseRules: DocumentChatFollowupRule[] = [
      { topic: 'overall', keywords: ['전체', '전반', '총평', '흐름'] },
      { topic: 'timing', keywords: ['언제', '시기', '몇 월', '분기', '타이밍'] },
      { topic: 'risk', keywords: ['조심', '주의', '위험', '문제', '불안'] },
    ];

    if (category === 'NEW_YEAR') {
      return [
        ...baseRules,
        { topic: '1분기', keywords: ['1분기', '초반', '연초', '1월', '2월', '3월'] },
        { topic: '2분기', keywords: ['2분기', '봄', '4월', '5월', '6월'] },
        { topic: '3분기', keywords: ['3분기', '여름', '7월', '8월', '9월'] },
        { topic: '4분기', keywords: ['4분기', '하반기', '연말', '10월', '11월', '12월'] },
      ];
    }

    return baseRules;
  }
}
