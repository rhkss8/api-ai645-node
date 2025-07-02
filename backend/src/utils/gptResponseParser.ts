/**
 * GPT 응답 파싱 유틸리티
 * 마크다운 코드블록을 제거하고 JSON을 안전하게 파싱합니다.
 */

export class GPTResponseParser {
  /**
   * GPT 응답에서 마크다운 코드블록을 제거하고 JSON을 파싱합니다.
   * @param response GPT 응답 텍스트
   * @returns 파싱된 JSON 객체
   * @throws Error 파싱 실패 시
   */
  static parseJSON(response: string): any {
    if (!response || typeof response !== 'string') {
      throw new Error('응답이 유효하지 않습니다.');
    }

    let cleanedResponse = response.trim();

    // 마크다운 코드블록 제거
    cleanedResponse = this.removeMarkdownCodeBlocks(cleanedResponse);

    // JSON 파싱 시도
    try {
      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      // 파싱 실패 시 더 자세한 오류 정보 제공
      const errorMessage = parseError instanceof Error ? parseError.message : '알 수 없는 파싱 오류';
      const responsePreview = cleanedResponse.substring(0, 200);
      
      throw new Error(
        `GPT 응답을 JSON으로 파싱할 수 없습니다. ` +
        `오류: ${errorMessage}. ` +
        `응답 미리보기: ${responsePreview}${cleanedResponse.length > 200 ? '...' : ''}`
      );
    }
  }

  /**
   * 마크다운 코드블록을 제거합니다.
   * @param text 원본 텍스트
   * @returns 코드블록이 제거된 텍스트
   */
  private static removeMarkdownCodeBlocks(text: string): string {
    // ```json ... ``` 형태 제거
    text = text.replace(/^```json\s*/, '');
    text = text.replace(/```\s*$/, '');
    
    // ``` ... ``` 형태 제거 (언어 지정 없는 경우)
    text = text.replace(/^```\s*/, '');
    text = text.replace(/```\s*$/, '');
    
    // 앞뒤 공백 제거
    return text.trim();
  }

  /**
   * GPT 응답이 유효한 JSON 형식인지 검증합니다.
   * @param response GPT 응답 텍스트
   * @returns 유효성 여부
   */
  static isValidJSON(response: string): boolean {
    try {
      this.parseJSON(response);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * GPT 응답에서 특정 필드가 존재하는지 확인합니다.
   * @param response GPT 응답 텍스트
   * @param requiredFields 필수 필드 배열
   * @returns 검증 결과
   */
  static validateRequiredFields(response: string, requiredFields: string[]): { isValid: boolean; missingFields: string[] } {
    try {
      const parsed = this.parseJSON(response);
      const missingFields: string[] = [];

      for (const field of requiredFields) {
        if (!(field in parsed)) {
          missingFields.push(field);
        }
      }

      return {
        isValid: missingFields.length === 0,
        missingFields
      };
    } catch {
      return {
        isValid: false,
        missingFields: requiredFields
      };
    }
  }

  /**
   * 로또 번호 추천 응답을 파싱하고 검증합니다.
   * @param response GPT 응답 텍스트
   * @param expectedGameCount 예상 게임 수
   * @returns 파싱된 추천 결과
   */
  static parseRecommendationResponse(response: string, expectedGameCount?: number): {
    numbers: number[][];
    analysis?: string;
    strategies?: string[];
    confidence?: number;
  } {
    const parsed = this.parseJSON(response);
    
    // 필수 필드 검증
    const validation = this.validateRequiredFields(response, ['recommendations']);
    if (!validation.isValid) {
      throw new Error(`추천 응답에 필수 필드가 없습니다: ${validation.missingFields.join(', ')}`);
    }

    const recommendations = parsed.recommendations;
    
    // 배열 검증
    if (!Array.isArray(recommendations)) {
      throw new Error('recommendations 필드가 배열이 아닙니다.');
    }

    // 게임 수 검증
    if (expectedGameCount && recommendations.length !== expectedGameCount) {
      throw new Error(`예상 게임 수(${expectedGameCount})와 실제 게임 수(${recommendations.length})가 일치하지 않습니다.`);
    }

    // 각 게임 검증
    const validGames: number[][] = [];
    for (let i = 0; i < recommendations.length; i++) {
      const game = recommendations[i];
      
      if (!Array.isArray(game)) {
        throw new Error(`게임 ${i + 1}이 배열이 아닙니다.`);
      }

      if (game.length !== 6) {
        throw new Error(`게임 ${i + 1}의 번호 개수가 6개가 아닙니다 (${game.length}개).`);
      }

      // 번호 유효성 검증
      const validNumbers = game.filter(num => typeof num === 'number' && num >= 1 && num <= 45);
      if (validNumbers.length !== 6) {
        throw new Error(`게임 ${i + 1}에 유효하지 않은 번호가 포함되어 있습니다.`);
      }

      // 중복 검증
      const uniqueNumbers = new Set(validNumbers);
      if (uniqueNumbers.size !== 6) {
        throw new Error(`게임 ${i + 1}에 중복된 번호가 있습니다.`);
      }

      validGames.push(validNumbers.sort((a, b) => a - b));
    }

    return {
      numbers: validGames,
      analysis: parsed.analysis,
      strategies: parsed.strategies,
      confidence: parsed.confidence
    };
  }

  /**
   * 이미지 번호 추출 응답을 파싱하고 검증합니다.
   * @param response GPT 응답 텍스트
   * @returns 파싱된 이미지 추출 결과
   */
  static parseImageExtractionResponse(response: string): {
    numbers: number[][];
    extractedText?: string;
    notes?: string;
  } {
    const parsed = this.parseJSON(response);
    
    // 필수 필드 검증
    const validation = this.validateRequiredFields(response, ['numbers']);
    if (!validation.isValid) {
      throw new Error(`이미지 추출 응답에 필수 필드가 없습니다: ${validation.missingFields.join(', ')}`);
    }

    const numbers = parsed.numbers;
    
    // 배열 검증
    if (!Array.isArray(numbers)) {
      throw new Error('numbers 필드가 배열이 아닙니다.');
    }

    // 각 게임 검증
    const validGames: number[][] = [];
    const invalidGames: string[] = [];
    
    for (let i = 0; i < numbers.length; i++) {
      const game = numbers[i];
      
      if (!Array.isArray(game)) {
        invalidGames.push(`게임 ${i + 1}: 배열이 아님 (${typeof game})`);
        continue;
      }

      // 번호 유효성 검증 및 정리
      const validNumbers = game.filter(num => typeof num === 'number' && num >= 1 && num <= 45);
      const invalidNumbers = game.filter(num => typeof num !== 'number' || num < 1 || num > 45);
      
      if (invalidNumbers.length > 0) {
        invalidGames.push(`게임 ${i + 1}: 잘못된 번호 ${invalidNumbers.join(', ')}`);
      }
      
      // 중복 제거
      const uniqueNumbers = [...new Set(validNumbers)];
      
      // 6개가 되는 경우만 유효한 게임으로 인정
      if (uniqueNumbers.length === 6) {
        validGames.push(uniqueNumbers.sort((a, b) => a - b));
      } else {
        invalidGames.push(`게임 ${i + 1}: 유효한 번호 ${uniqueNumbers.length}개 (필요: 6개)`);
      }
    }

    // 유효한 게임이 없어도 오류를 던지지 않고 빈 배열 반환
    const notes = parsed.notes || 
      (validGames.length > 0 
        ? `총 ${validGames.length}게임 추출됨${invalidGames.length > 0 ? `, ${invalidGames.length}개 무효 게임` : ''}`
        : `유효한 로또 번호를 찾을 수 없음${invalidGames.length > 0 ? ` (${invalidGames.join('; ')})` : ''}`
      );

    return {
      numbers: validGames,
      extractedText: parsed.extractedText || '',
      notes
    };
  }
} 