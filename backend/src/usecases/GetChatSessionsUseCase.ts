import { PrismaClient, FortuneCategory as PrismaFortuneCategory, SessionMode as PrismaSessionMode } from '@prisma/client';
import { CATEGORY_NAMES } from '../data/fortuneProducts';
import { ResultTokenService } from '../services/ResultTokenService';
import { FortuneCategory, FormType, SessionMode } from '../types/fortune';

export interface ChatSessionHistoryItem {
  sessionId: string;
  category: string;
  formType: string | null;
  title: string;
  resultToken: string;
  isActive: boolean;
  remainingTime: number;
  createdAt: Date;
  updatedAt: Date;
  lastMessagePreview?: string | null;
  lastMessageAt?: Date | null;
  chatCount: number;
}

export interface GetChatSessionsParams {
  userId: string;
  page?: number;
  limit?: number;
}

export interface GetChatSessionsResult {
  items: ChatSessionHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function getLastMessagePreview(raw?: string | null): string | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { message?: string };
    if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
      return parsed.message.trim().slice(0, 80);
    }
  } catch {
    // ignore parse failure and fall back to raw text
  }

  return raw.trim().slice(0, 80);
}

export class GetChatSessionsUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly resultTokenService: ResultTokenService,
  ) {}

  async execute(params: GetChatSessionsParams): Promise<GetChatSessionsResult> {
    const { userId, page = 1, limit = 20 } = params;

    const where = {
      userId,
      mode: PrismaSessionMode.CHAT,
    };

    const total = await this.prisma.fortuneSession.count({ where });

    const sessions = await this.prisma.fortuneSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        conversationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            userInput: true,
            aiOutput: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            conversationLogs: true,
          },
        },
      },
    });

    const items: ChatSessionHistoryItem[] = sessions.map((session) => {
      const latestLog = session.conversationLogs[0];
      const preview =
        (latestLog?.userInput && latestLog.userInput.trim()) ||
        getLastMessagePreview(latestLog?.aiOutput) ||
        session.userInput ||
        null;

      return {
        sessionId: session.id,
        category: session.category,
        formType: session.formType,
        title: CATEGORY_NAMES[session.category as PrismaFortuneCategory] || session.category,
        resultToken: this.resultTokenService.sign({
          sessionId: session.id,
          userId,
          category: session.category as unknown as FortuneCategory,
          formType: (session.formType || 'ASK') as FormType,
          mode: session.mode as unknown as SessionMode,
        }),
        isActive: session.isActive,
        remainingTime: session.remainingTime,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastMessagePreview: preview,
        lastMessageAt: latestLog?.createdAt || null,
        chatCount: session._count.conversationLogs,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
