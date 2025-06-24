import { IPLimitRecord } from '@/entities/IPLimitRecord';
import { IIPLimitRepository } from '@/repositories/IIPLimitRepository';

export class IPLimitService {
  private static instance: IPLimitService;
  private readonly MAX_REQUESTS_PER_DAY = 1;

  constructor(private readonly ipLimitRepository: IIPLimitRepository) {
    // 매일 자정에 오래된 기록 정리
    this.scheduleCleanup();
  }

  public static getInstance(ipLimitRepository?: IIPLimitRepository): IPLimitService {
    if (!IPLimitService.instance) {
      if (!ipLimitRepository) {
        throw new Error('IPLimitRepository is required for first initialization');
      }
      IPLimitService.instance = new IPLimitService(ipLimitRepository);
    }
    return IPLimitService.instance;
  }

  /**
   * IP 주소가 오늘 요청 가능한지 확인
   */
  public async canMakeRequest(ipAddress: string): Promise<boolean> {
    try {
      const today = this.getTodayString();
      const record = await this.ipLimitRepository.findByIP(ipAddress);

      if (!record) {
        return true; // 첫 요청
      }

      if (record.lastRequestDate !== today) {
        return true; // 새로운 날
      }

      return record.requestCount < this.MAX_REQUESTS_PER_DAY;
    } catch (error) {
      console.error('[IPLimitService] canMakeRequest 오류:', error);
      // 오류 시 요청 허용 (서비스 연속성)
      return true;
    }
  }

  /**
   * IP 주소의 요청을 기록
   */
  public async recordRequest(ipAddress: string): Promise<void> {
    try {
      const today = this.getTodayString();
      const existingRecord = await this.ipLimitRepository.findByIP(ipAddress);

      if (!existingRecord || existingRecord.lastRequestDate !== today) {
        // 새로운 날이거나 첫 요청
        await this.ipLimitRepository.upsert(ipAddress, today, 1);
      } else {
        // 같은 날 추가 요청
        const updatedRecord = existingRecord.incrementCount();
        await this.ipLimitRepository.update(updatedRecord);
      }
    } catch (error) {
      console.error('[IPLimitService] recordRequest 오류:', error);
      // 오류 발생 시에도 계속 진행 (서비스 연속성)
    }
  }

  /**
   * IP 주소의 남은 요청 횟수 반환
   */
  public async getRemainingRequests(ipAddress: string): Promise<number> {
    try {
      const today = this.getTodayString();
      const record = await this.ipLimitRepository.findByIP(ipAddress);

      if (!record || record.lastRequestDate !== today) {
        return this.MAX_REQUESTS_PER_DAY;
      }

      return Math.max(0, this.MAX_REQUESTS_PER_DAY - record.requestCount);
    } catch (error) {
      console.error('[IPLimitService] getRemainingRequests 오류:', error);
      return this.MAX_REQUESTS_PER_DAY;
    }
  }

  /**
   * IP 주소의 다음 요청 가능 시간 반환
   */
  public async getNextAllowedTime(ipAddress: string): Promise<Date> {
    try {
      const today = this.getTodayString();
      const record = await this.ipLimitRepository.findByIP(ipAddress);

      if (!record || record.lastRequestDate !== today) {
        return new Date(); // 지금 바로 가능
      }

      if (record.requestCount < this.MAX_REQUESTS_PER_DAY) {
        return new Date(); // 아직 가능
      }

      // 다음 날 00:00:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    } catch (error) {
      console.error('[IPLimitService] getNextAllowedTime 오류:', error);
      return new Date(); // 오류 시 즉시 허용
    }
  }

  /**
   * 현재 날짜를 YYYY-MM-DD 형식으로 반환
   */
  private getTodayString(): string {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    if (!dateString) {
      throw new Error('날짜 문자열 생성에 실패했습니다.');
    }
    return dateString;
  }

  /**
   * 매일 자정에 오래된 기록 정리
   */
  private scheduleCleanup(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.cleanupOldRecords();
      
      // 24시간마다 반복
      setInterval(() => {
        this.cleanupOldRecords();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  /**
   * 오늘이 아닌 날짜의 기록들을 정리
   */
  private async cleanupOldRecords(): Promise<void> {
    try {
      const today = this.getTodayString();
      const deletedCount = await this.ipLimitRepository.deleteOldRecords(today);
      
      console.log(`[IPLimitService] 정리 완료: ${deletedCount}개 IP 기록 제거`);
    } catch (error) {
      console.error('[IPLimitService] cleanupOldRecords 오류:', error);
    }
  }

  /**
   * 개발/테스트용: 모든 기록 초기화
   */
  public async clearAllRecords(): Promise<void> {
    try {
      const deletedCount = await this.ipLimitRepository.deleteAll();
      console.log(`[IPLimitService] 모든 IP 기록이 초기화되었습니다. (${deletedCount}개 삭제)`);
    } catch (error) {
      console.error('[IPLimitService] clearAllRecords 오류:', error);
    }
  }

  /**
   * 개발/테스트용: 현재 기록 상태 조회
   */
  public async getAllRecords(): Promise<IPLimitRecord[]> {
    try {
      return await this.ipLimitRepository.findAll();
    } catch (error) {
      console.error('[IPLimitService] getAllRecords 오류:', error);
      return [];
    }
  }
} 