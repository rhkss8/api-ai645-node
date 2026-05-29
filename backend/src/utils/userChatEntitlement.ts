/**
 * Account-level chat quota: User.chatUsableUntil (signup grant + paid extensions).
 */
import type { Prisma } from '@prisma/client';
import { FortuneProductType, ChatEntitlementDays } from '../types/fortune';

/** Default grant on signup: 1 hour */
export const CHAT_SIGNUP_GRANT_MS = 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

export function extensionMsFromEntitlementDays(days: ChatEntitlementDays): number {
  return days * DAY_MS;
}

export function parseChatEntitlementDays(raw: unknown): ChatEntitlementDays | null {
  const n = Number(raw);
  if (n === 1 || n === 7 || n === 30) return n as ChatEntitlementDays;
  return null;
}

function shouldApplyChatExtensionFromMetadata(meta: Record<string, unknown>): boolean {
  const pt = meta.productType as string | undefined;
  if (pt !== FortuneProductType.CHAT_SESSION) return false;
  return parseChatEntitlementDays(meta.chatEntitlementDays) != null;
}

/**
 * Stack-extend User.chatUsableUntil from completed order metadata:
 * newUntil = max(now, currentUntil) + purchasedDuration
 */
export async function applyUserChatExtensionFromOrderTx(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  const meta = (order.metadata as Record<string, unknown>) || {};
  if (!shouldApplyChatExtensionFromMetadata(meta)) return;

  const days = parseChatEntitlementDays(meta.chatEntitlementDays);
  if (days == null) return;

  const addMs = extensionMsFromEntitlementDays(days);
  const user = await tx.user.findUnique({ where: { id: order.userId } });
  if (!user) return;

  const now = new Date();
  const currentUntil = user.chatUsableUntil ? new Date(user.chatUsableUntil) : null;
  const base =
    currentUntil && currentUntil.getTime() > now.getTime() ? currentUntil : now;
  const newUntil = new Date(base.getTime() + addMs);

  await tx.user.update({
    where: { id: order.userId },
    data: { chatUsableUntil: newUntil },
  });
}

/** Stack-extend by raw milliseconds (e.g. Hongsi / manual top-up). */
export async function extendUserChatByMsTx(
  tx: Prisma.TransactionClient,
  userId: string,
  addMs: number,
): Promise<void> {
  if (addMs <= 0) return;
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const now = new Date();
  const currentUntil = user.chatUsableUntil ? new Date(user.chatUsableUntil) : null;
  const base =
    currentUntil && currentUntil.getTime() > now.getTime() ? currentUntil : now;
  const newUntil = new Date(base.getTime() + addMs);
  await tx.user.update({
    where: { id: userId },
    data: { chatUsableUntil: newUntil },
  });
}
