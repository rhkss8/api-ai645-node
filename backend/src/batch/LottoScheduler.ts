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

      // 1. API에서 최신 회차 정보 확인
      const latestApiResponse = await this.lottoApiService.getLatestLottoNumbers();
      if (!latestApiResponse) {
        console.log('❌ API에서 최신 회차 정보를 가져올 수 없습니다.');
        return;
      }

      const latestApiRound = latestApiResponse.drwNo;
      console.log(`📡 API 최신 회차: ${latestApiRound}`);

      // 2. DB에서 가장 최신 회차 조회
      const latestDbRecord = await this.winningNumbersRepository.findLatest();
      const latestDbRound = latestDbRecord ? latestDbRecord.round : 0;
      console.log(`💾 DB 최신 회차: ${latestDbRound}`);

      // 3. 누락된 회차들을 순차적으로 저장
      if (latestApiRound > latestDbRound) {
        const missingRounds = latestApiRound - latestDbRound;
        console.log(`🔄 누락된 회차 ${missingRounds}개를 순차 저장합니다.`);

        for (let round = latestDbRound + 1; round <= latestApiRound; round++) {
          await this.fetchAndSaveRound(round);
          
          // API 호출 간격 조절 (너무 빈번한 요청 방지)
          if (round < latestApiRound) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
          }
        }
      } else {
        console.log('✅ DB가 최신 상태입니다.');
      }

      console.log('🎯 로또 최신번호 조회 배치 완료!');
    } catch (error) {
      console.error('❌ 로또 번호 조회 배치 실패:', error);
    }
  }

  /**
   * 특정 회차 조회 및 저장
   */
  private async fetchAndSaveRound(round: number): Promise<void> {
    try {
      console.log(`📥 회차 ${round} 조회 중...`);

      // 동행복권 API 호출
      const apiResponse = await this.lottoApiService.getLottoNumbers(round);

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

        // 중복 체크
        const existingRecord = await this.winningNumbersRepository.findByRound(round);
        if (existingRecord) {
          console.log(`⚠️ 회차 ${round}는 이미 저장되어 있습니다.`);
          return;
        }

        // DB에 저장
        await this.winningNumbersRepository.create(winningNumbers);

        console.log(`회차 ${round} 당첨번호 저장 완료:`, {
          numbers: apiData.numbers.slice(0, 6),
          bonusNumber: apiData.bonusNumber,
          firstWinningAmount: apiData.firstWinningAmount.toString(),
          drawDate: apiData.drawDate
        });
      } else {
        console.log(`⚠️ 회차 ${round}: 아직 발표되지 않았거나 조회할 수 없습니다.`);
      }
    } catch (error) {
      console.error(`❌ 회차 ${round} 저장 실패:`, error);
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