/**
 * 홍시 구매 UseCase
 */
import { IHongsiCreditRepository } from '../repositories/IHongsiCreditRepository';
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { HongsiUnit } from '../types/fortune';

export class PurchaseHongsiUseCase {
  constructor(
    private readonly hongsiCreditRepository: IHongsiCreditRepository,
    private readonly sessionRepository: IFortuneSessionRepository,
  ) {}

  async execute(
    userId: string,
    unit: HongsiUnit,
    sessionId?: string,
  ): Promise<{ minutes: number; totalAvailableTime: number }> {
    // 단위별 분 수
    const unitMinutes: Record<HongsiUnit, number> = {
      [HongsiUnit.FREE]: 0, // 무료는 구매 불가
      [HongsiUnit.MINUTES_5]: 5,
      [HongsiUnit.MINUTES_10]: 10,
      [HongsiUnit.MINUTES_30]: 30,
    };

    if (unit === HongsiUnit.FREE) {
      throw new Error('무료 홍시는 구매할 수 없습니다.');
    }

    const minutes = unitMinutes[unit];
    if (!minutes) {
      throw new Error('유효하지 않은 홍시 단위입니다.');
    }

    // 유료 시간 추가
    await this.hongsiCreditRepository.addPaidMinutes(userId, minutes);

    // 활성 세션이 있으면 시간 연장
    if (sessionId) {
      const session = await this.sessionRepository.findById(sessionId);
      if (session && session.isActive && session.userId === userId) {
        const extendedSession = session.addTime(minutes * 60); // 분 -> 초
        await this.sessionRepository.update(extendedSession);
      }
    }

    // 사용 가능한 총 시간 반환
    const totalAvailableTime = await this.hongsiCreditRepository.getAvailableTimeToday(userId);

    return {
      minutes,
      totalAvailableTime,
    };
  }
}
