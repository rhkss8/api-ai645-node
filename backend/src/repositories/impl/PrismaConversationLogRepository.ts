/**
 * Prisma 기반 대화 로그 리포지토리
 */
import { PrismaClient } from '@prisma/client';
import { ConversationLog } from '../../entities/ConversationLog';
import { IConversationLogRepository } from '../IConversationLogRepository';

export class PrismaConversationLogRepository implements IConversationLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(log: ConversationLog): Promise<ConversationLog> {
    const created = await this.prisma.conversationLog.create({
      data: {
        id: log.id,
        sessionId: log.sessionId,
        userInput: log.userInput,
        aiOutput: log.aiOutput,
        elapsedTime: log.elapsedTime,
        isPaid: log.isPaid,
      },
    });

    return this.toEntity(created);
  }

  async findBySessionId(sessionId: string): Promise<ConversationLog[]> {
    const logs = await this.prisma.conversationLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map(l => this.toEntity(l));
  }

  async findById(id: string): Promise<ConversationLog | null> {
    const found = await this.prisma.conversationLog.findUnique({
      where: { id },
    });

    return found ? this.toEntity(found) : null;
  }

  private toEntity(prismaLog: any): ConversationLog {
    return new ConversationLog(
      prismaLog.id,
      prismaLog.sessionId,
      prismaLog.userInput,
      prismaLog.aiOutput,
      prismaLog.elapsedTime,
      prismaLog.isPaid,
      prismaLog.createdAt,
    );
  }
}
