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