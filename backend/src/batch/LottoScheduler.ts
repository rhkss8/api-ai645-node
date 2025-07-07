import cron from 'node-cron';
import { LottoApiService } from '../services/LottoApiService';
import { PrismaWinningNumbersRepository } from '../repositories/impl/PrismaWinningNumbersRepository';
import { PrismaClient } from '@prisma/client';
import { WinningNumbers } from '../entities/WinningNumbers';
import { IdGenerator } from '../utils/idGenerator';

export class LottoScheduler {
  private readonly lottoApiService: LottoApiService;
  private readonly winningNumbersRepository: PrismaWinningNumbersRepository;

  constructor() {
    this.lottoApiService = new LottoApiService();
    this.winningNumbersRepository = new PrismaWinningNumbersRepository(new PrismaClient());
  }

  /**
   * 최신 회차 조회 및 저장
   */
  async fetchAndSaveLatestLottoNumbers(): Promise<void> {
    try {
      console.log('로또 최신번호 조회 배치 시작...');

      // DB에서 가장 최신 회차 조회
      const latestWinningNumbers = await this.winningNumbersRepository.findLatest();
      const nextRound = latestWinningNumbers ? latestWinningNumbers.round + 1 : 1;

      console.log(`다음 회차 조회: ${nextRound}`);

      // 동행복권 API 호출
      const apiResponse = await this.lottoApiService.getLottoNumbers(nextRound);

      if (apiResponse) {
        // API 응답을 DB 구조에 맞게 변환
        const apiData = this.lottoApiService.transformToWinningNumbers(apiResponse);

        // WinningNumbers 엔티티 생성
        const winningNumbers = WinningNumbers.create(
          IdGenerator.generateWinningNumbersId(),
          apiData.round,
          apiData.numbers.slice(0, 6), // 보너스번호 제외한 6개 번호
          apiData.bonusNumber,
          apiData.firstWinningAmount,
          apiData.drawDate
        );

        // 유효성 검사
        winningNumbers.validate();

        // DB에 저장
        await this.winningNumbersRepository.create(winningNumbers);

        console.log(`회차 ${nextRound} 당첨번호 저장 완료:`, {
          numbers: winningNumbers.getMainNumbers(),
          bonusNumber: winningNumbers.getBonusNumber(),
          firstWinningAmount: winningNumbers.firstWinningAmount.toString(),
          drawDate: winningNumbers.drawDate
        });
      } else {
        console.log(`회차 ${nextRound}: 아직 당첨번호가 발표되지 않았습니다.`);
      }
    } catch (error) {
      console.error('로또 최신번호 조회 배치 오류:', error);
    }
  }

  /**
   * 스케줄러 시작
   */
  startScheduler(): void {
    console.log('로또 스케줄러 시작...');

    // 매주 토요일 21:00 (저녁 9시)
    cron.schedule('0 21 * * 6', async () => {
      console.log('매주 토요일 21:00 - 로또 최신번호 조회 실행');
      await this.fetchAndSaveLatestLottoNumbers();
    });

    // 매주 토요일 21:30 (저녁 9시 30분)
    cron.schedule('30 21 * * 6', async () => {
      console.log('매주 토요일 21:30 - 로또 최신번호 조회 실행');
      await this.fetchAndSaveLatestLottoNumbers();
    });

    console.log('로또 스케줄러 등록 완료: 매주 토요일 21:00, 21:30');
  }

  /**
   * 수동 실행 (테스트용)
   */
  async manualFetch(): Promise<void> {
    console.log('수동 로또 최신번호 조회 실행');
    await this.fetchAndSaveLatestLottoNumbers();
  }
} 