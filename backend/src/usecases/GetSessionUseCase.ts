/**
 * 세션 조회 UseCase
 */
import { PrismaClient } from '@prisma/client';
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { SessionMode } from '../types/fortune';

export class GetSessionUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(sessionId: string, userId: string): Promise<any> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('세션을 찾을 수 없습니다.');
    }

    if (session.userId !== userId) {
      throw new Error('권한이 없습니다.');
    }

    const now = new Date();
    let remainingTime: number;
    let chatUsableUntilIso: string | undefined;

    if (session.mode === SessionMode.CHAT) {
      const u = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { chatUsableUntil: true },
      });
      const until = u?.chatUsableUntil;
      chatUsableUntilIso = until?.toISOString();
      remainingTime =
        until && until.getTime() > now.getTime()
          ? Math.max(0, Math.floor((until.getTime() - now.getTime()) / 1000))
          : 0;
    } else {
      remainingTime = session.chatEntitlementExpiresAt
        ? Math.max(
            0,
            Math.floor(
              (session.chatEntitlementExpiresAt.getTime() - now.getTime()) / 1000,
            ),
          )
        : session.remainingTime;
    }

    return {
      sessionId: session.id,
      category: session.category,
      mode: session.mode,
      remainingTime,
      isActive: session.isActive,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      chatUsableUntil: chatUsableUntilIso,
      chatEntitlementExpiresAt: session.chatEntitlementExpiresAt
        ? session.chatEntitlementExpiresAt.toISOString()
        : undefined,
    };
  }
}
