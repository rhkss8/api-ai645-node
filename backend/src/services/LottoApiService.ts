import axios from 'axios';

interface LottoApiResponse {
  returnValue: string;
  drwNo: number;
  drwNoDate: string;
  drwtNo1: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo4: number;
  drwtNo5: number;
  drwtNo6: number;
  bnusNo: number;
  firstWinamnt: number;
  totSellamnt: number;
  firstPrzwnerCo: number;
  firstAccumamnt: number;
}

export class LottoApiService {
  private readonly baseUrl = 'https://www.dhlottery.co.kr/common.do';

  /**
   * 최신 회차 당첨번호 조회 (회차 번호 지정 없이)
   */
  async getLatestLottoNumbers(): Promise<LottoApiResponse | null> {
    try {
      // 1차: 동행복권 공식 API 시도
      const response = await axios.get<LottoApiResponse>(this.baseUrl, {
        params: {
          method: 'getLottoNumber'
          // drwNo 파라미터 없이 호출하면 최신 회차 반환
        },
        timeout: 10000
      });

      if (response.data.returnValue === 'success') {
        console.log(`✅ 최신 회차 ${response.data.drwNo} 당첨번호 조회 성공`);
        return response.data;
      } else {
        console.log('⚠️ 동행복권 API에서 최신 회차 조회 실패, 대안 API 시도...');
        return await this.getLatestFromGitHub();
      }
    } catch (error) {
      console.error('❌ 동행복권 API 오류, 대안 API 시도:', error);
      return await this.getLatestFromGitHub();
    }
  }

  /**
   * 특정 회차의 로또 당첨번호 조회
   */
  async getLottoNumbers(round: number): Promise<LottoApiResponse | null> {
    try {
      const response = await axios.get<LottoApiResponse>(this.baseUrl, {
        params: {
          method: 'getLottoNumber',
          drwNo: round
        },
        timeout: 10000 // 10초 타임아웃
      });

      if (response.data.returnValue === 'success') {
        return response.data;
      } else {
        console.log(`회차 ${round}: 당첨번호가 아직 발표되지 않았습니다.`);
        return null;
      }
    } catch (error) {
      console.error(`회차 ${round} 조회 중 오류 발생:`, error);
      return null;
    }
  }

  /**
   * GitHub 오픈소스 로또 데이터에서 최신 회차 조회 (대안)
   */
  private async getLatestFromGitHub(): Promise<LottoApiResponse | null> {
    try {
      console.log('🔄 GitHub 로또 데이터 API 호출...');
      
      const response = await axios.get('https://smok95.github.io/lotto/results/latest.json', {
        timeout: 5000
      });

      const data = response.data;
      
      // GitHub 데이터를 동행복권 API 형식으로 변환
      const converted: LottoApiResponse = {
        returnValue: 'success',
        drwNo: data.draw_no,
        drwNoDate: data.date.split('T')[0], // ISO 날짜를 YYYY-MM-DD 형식으로
        drwtNo1: data.numbers[0],
        drwtNo2: data.numbers[1],
        drwtNo3: data.numbers[2],
        drwtNo4: data.numbers[3],
        drwtNo5: data.numbers[4],
        drwtNo6: data.numbers[5],
        bnusNo: data.bonus_no,
        firstWinamnt: data.divisions[0]?.prize || 0,
        totSellamnt: data.total_sales_amount || 0,
        firstPrzwnerCo: data.divisions[0]?.winners || 0,
        firstAccumamnt: 0 // GitHub 데이터에는 없음
      };

      console.log(`✅ GitHub에서 최신 회차 ${converted.drwNo} 조회 성공`);
      return converted;
      
    } catch (error) {
      console.error('❌ GitHub 로또 데이터 조회도 실패:', error);
      return null;
    }
  }

  /**
   * API 응답을 DB 구조에 맞게 변환
   */
  transformToWinningNumbers(apiResponse: LottoApiResponse) {
    const numbers = [
      apiResponse.drwtNo1,
      apiResponse.drwtNo2,
      apiResponse.drwtNo3,
      apiResponse.drwtNo4,
      apiResponse.drwtNo5,
      apiResponse.drwtNo6,
      apiResponse.bnusNo
    ];

    return {
      round: apiResponse.drwNo,
      numbers: numbers,
      bonusNumber: apiResponse.bnusNo,
      firstWinningAmount: BigInt(apiResponse.firstWinamnt),
      drawDate: new Date(apiResponse.drwNoDate)
    };
  }
} 