/**
 * 홍시 크레딧 리포지토리 인터페이스
 */
export interface IHongsiCreditRepository {
  /**
   * 오늘의 무료 홍시 사용 여부 확인
   */
  isFreeHongsiUsedToday(userId: string): Promise<boolean>;

  /**
   * 오늘의 무료 홍시 사용 처리
   */
  useFreeHongsi(userId: string): Promise<void>;

  /**
   * 유료 시간 추가
   */
  addPaidMinutes(userId: string, minutes: number): Promise<void>;

  /**
   * 오늘 사용 가능한 총 시간(초) 반환
   * 무료 홍시 사용 가능하면 120초, 아니면 0초 + 유료 구매 시간
   */
  getAvailableTimeToday(userId: string): Promise<number>;
}
