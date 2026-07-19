/**
 * 세션 조회 UseCase
 */
import { PrismaClient } from '@prisma/client';
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { FortuneSession } from '../entities/FortuneSession';
import { SessionMode } from '../types/fortune';
import {
  ADMIN_PAYMENT_BYPASS_REMAINING_SECONDS,
  getAdminPaymentBypassUntil,
  isAdminRole,
} from '../utils/adminPaymentBypass';

export class GetSessionUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(sessionId: string, userId: string): Promise<any> {
    let session = await this.sessionRepository.findById(sessionId);

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
        select: { chatUsableUntil: true, role: true },
      });
      const isAdmin = isAdminRole(u?.role);
      const until = isAdmin ? getAdminPaymentBypassUntil(now) : u?.chatUsableUntil;
      chatUsableUntilIso = until?.toISOString();
      remainingTime =
        isAdmin
          ? ADMIN_PAYMENT_BYPASS_REMAINING_SECONDS
          : until && until.getTime() > now.getTime()
            ? Math.max(0, Math.floor((until.getTime() - now.getTime()) / 1000))
          : 0;

      if (!session.isActive && remainingTime > 0) {
        session = new FortuneSession(
          session.id,
          session.userId,
          session.category,
          session.mode,
          remainingTime,
          true,
          session.createdAt,
          until!,
          session.formType,
          session.userInput,
          session.userData,
          until!,
        );
        await this.sessionRepository.update(session);
      }
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
