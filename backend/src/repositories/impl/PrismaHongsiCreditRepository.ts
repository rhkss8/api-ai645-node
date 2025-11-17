/**
 * Prisma 기반 홍시 크레딧 리포지토리
 */
import { PrismaClient } from '@prisma/client';
import { IHongsiCreditRepository } from '../IHongsiCreditRepository';

export class PrismaHongsiCreditRepository implements IHongsiCreditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * 오늘의 무료 홍시 사용 여부 확인
   */
  async isFreeHongsiUsedToday(userId: string): Promise<boolean> {
    const uid = userId as unknown as string;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const credit = await this.prisma.hongsiCredit.findUnique({
      where: {
        userId_creditDate: {
          userId: uid,
          creditDate: today,
        },
      },
    } as any);

    return credit?.freeUsed || false;
  }

  /**
   * 오늘의 무료 홍시 사용 처리
   */
  async useFreeHongsi(userId: string): Promise<void> {
    const uid = userId as unknown as string;
    const today = new Date().toISOString().split('T')[0];

    await this.prisma.hongsiCredit.upsert({
      where: {
        userId_creditDate: {
          userId: uid,
          creditDate: today,
        },
      },
      create: {
        userId: uid,
        creditDate: today,
        freeUsed: true,
        paidMinutes: 0,
      },
      update: {
        freeUsed: true,
      },
    } as any);
  }

  /**
   * 유료 시간 추가 (분 단위)
   */
  async addPaidMinutes(userId: string, minutes: number): Promise<void> {
    const uid = userId as unknown as string;
    const today = new Date().toISOString().split('T')[0];

    await this.prisma.hongsiCredit.upsert({
      where: {
        userId_creditDate: {
          userId: uid,
          creditDate: today,
        },
      },
      create: {
        userId: uid,
        creditDate: today,
        freeUsed: false,
        paidMinutes: minutes,
      },
      update: {
        paidMinutes: {
          increment: minutes,
        },
      },
    } as any);
  }

  /**
   * 오늘 사용 가능한 총 시간(초) 반환
   * 무료 홍시 사용 가능하면 120초(2분), 아니면 0초 + 유료 구매 시간
   */
  async getAvailableTimeToday(userId: string): Promise<number> {
    const uid = userId as unknown as string;
    const today = new Date().toISOString().split('T')[0];

    const credit = await this.prisma.hongsiCredit.findUnique({
      where: {
        userId_creditDate: {
          userId: uid,
          creditDate: today,
        },
      },
    } as any);

    let availableTime = 0;

    // 무료 홍시 사용 안 했으면 2분(120초) 추가
    if (!credit || !credit.freeUsed) {
      availableTime += 120;
    }

    // 유료 구매 시간 추가 (분 -> 초 변환)
    if (credit?.paidMinutes) {
      availableTime += credit.paidMinutes * 60;
    }

    return availableTime;
  }
}
