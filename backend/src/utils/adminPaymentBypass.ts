export const ADMIN_PAYMENT_BYPASS_REMAINING_SECONDS = 10 * 365 * 24 * 60 * 60;

export function isAdminRole(role?: string | null): boolean {
  return role === 'ADMIN';
}

export function getAdminPaymentBypassUntil(now = new Date()): Date {
  return new Date(now.getTime() + ADMIN_PAYMENT_BYPASS_REMAINING_SECONDS * 1000);
}
