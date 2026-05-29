/**
 * Prisma 기반 운세 세션 리포지토리
 */
import { PrismaClient, FortuneCategory as PrismaFortuneCategory, SessionMode as PrismaSessionMode } from '@prisma/client';
import { FortuneCategory, SessionMode } from '../../types/fortune';
import { FortuneSession } from '../../entities/FortuneSession';
import { IFortuneSessionRepository } from '../IFortuneSessionRepository';

export class PrismaFortuneSessionRepository implements IFortuneSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(session: FortuneSession): Promise<FortuneSession> {
    const created = await this.prisma.fortuneSession.create({
      data: {
        id: session.id,
        userId: session.userId,
        category: session.category as PrismaFortuneCategory,
        mode: session.mode as PrismaSessionMode,
        formType: session.formType as any,
        userInput: session.userInput,
        userData: session.userData ? JSON.parse(JSON.stringify(session.userData)) : null,
        remainingTime: session.remainingTime,
        isActive: session.isActive,
        expiresAt: session.expiresAt,
        chatEntitlementExpiresAt: session.chatEntitlementExpiresAt ?? null,
      },
    });

    return this.toEntity(created);
  }

  async findById(id: string): Promise<FortuneSession | null> {
    const found = await this.prisma.fortuneSession.findUnique({
      where: { id },
    });

    return found ? this.toEntity(found) : null;
  }

  async findByUserId(userId: string, isActive?: boolean): Promise<FortuneSession[]> {
    const where: any = { userId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const sessions = await this.prisma.fortuneSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(s => this.toEntity(s));
  }

  async update(session: FortuneSession): Promise<FortuneSession> {
    const updated = await this.prisma.fortuneSession.update({
      where: { id: session.id },
      data: {
        remainingTime: session.remainingTime,
        isActive: session.isActive,
        expiresAt: session.expiresAt,
        chatEntitlementExpiresAt: session.chatEntitlementExpiresAt ?? null,
      },
    });

    return this.toEntity(updated);
  }

  async updateSessionData(
    id: string,
    patch: {
      userInput?: string | null;
      userData?: Record<string, any> | null;
    },
  ): Promise<FortuneSession> {
    const updated = await this.prisma.fortuneSession.update({
      where: { id },
      data: {
        ...(patch.userInput !== undefined ? { userInput: patch.userInput } : {}),
        ...(patch.userData !== undefined
          ? {
              userData: patch.userData
                ? JSON.parse(JSON.stringify(patch.userData))
                : null,
            }
          : {}),
      },
    });

    return this.toEntity(updated);
  }

  async closeSession(id: string): Promise<void> {
    await this.prisma.fortuneSession.update({
      where: { id },
      data: {
        isActive: false,
        remainingTime: 0,
        expiresAt: new Date(),
        chatEntitlementExpiresAt: null,
      },
    });
  }

  async findActiveByUserIdAndCategory(
    userId: string,
    category: FortuneCategory,
    mode?: SessionMode,
  ): Promise<FortuneSession | null> {
    const now = new Date();
    const found = await this.prisma.fortuneSession.findFirst({
      where: {
        userId,
        category: category as PrismaFortuneCategory,
        ...(mode ? { mode: mode as PrismaSessionMode } : {}),
        isActive: true,
        OR: [
          {
            chatEntitlementExpiresAt: { not: null, gt: now },
          },
          {
            chatEntitlementExpiresAt: null,
            expiresAt: { gt: now },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return found ? this.toEntity(found) : null;
  }

  async findExpiredActiveSessions(): Promise<FortuneSession[]> {
    const now = new Date();
    const sessions = await this.prisma.fortuneSession.findMany({
      where: {
        isActive: true,
        OR: [
          {
            AND: [
              { chatEntitlementExpiresAt: { not: null } },
              { chatEntitlementExpiresAt: { lte: now } },
            ],
          },
          {
            AND: [
              { chatEntitlementExpiresAt: null },
              { expiresAt: { lte: now } },
            ],
          },
        ],
      },
    });

    return sessions.map(s => this.toEntity(s));
  }

  private toEntity(prismaSession: any): FortuneSession {
    return new FortuneSession(
      prismaSession.id,
      prismaSession.userId,
      prismaSession.category as PrismaFortuneCategory as unknown as FortuneCategory,
      prismaSession.mode as PrismaSessionMode as unknown as SessionMode,
      prismaSession.remainingTime,
      prismaSession.isActive,
      prismaSession.createdAt,
      prismaSession.expiresAt,
      prismaSession.formType as any,
      prismaSession.userInput,
      prismaSession.userData as Record<string, any> | undefined,
      prismaSession.chatEntitlementExpiresAt ?? null,
    );
  }
}
