import { IGPTService } from '../repositories/IGPTService';
import { UploadedFile, ImageExtractResult } from '../types/common';

export class ExtractImageNumbersUseCase {
  constructor(private readonly gptService: IGPTService) {}

  async execute(image: UploadedFile): Promise<ImageExtractResult> {
    try {
      console.log(`🔄 이미지 번호 추출 시작: ${image.originalname}`);
      
      // 1. 이미지 검증
      this.validateImage(image);

      // 2. GPT를 통한 번호 추출
      console.log(`🤖 GPT 서비스 호출 중...`);
      const result = await this.gptService.extractNumbersFromImage(image);

      // 3. 결과 검증 및 후처리
      console.log(`✅ 결과 검증 및 후처리 중...`);
      return this.validateAndProcessResult(result);
    } catch (error) {
      console.error('이미지 번호 추출 UseCase 오류:', {
        error: error instanceof Error ? error.message : error,
        imageName: image.originalname,
        imageSize: image.size,
        imageType: image.mimetype,
      });
      
      if (error instanceof Error) {
        throw new Error(`이미지 처리 실패: ${error.message}`);
      }
      throw error;
    }
  }

  private validateImage(image: UploadedFile): void {
    if (!image) {
      throw new Error('이미지 파일이 제공되지 않았습니다.');
    }

    if (!image.buffer || image.buffer.length === 0) {
      throw new Error('이미지 데이터가 비어 있습니다.');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const minSize = 1024; // 1KB

    if (!allowedMimeTypes.includes(image.mimetype)) {
      throw new Error(`지원하지 않는 이미지 형식입니다: ${image.mimetype}. 지원 형식: ${allowedMimeTypes.join(', ')}`);
    }

    if (image.size > maxSize) {
      throw new Error(`이미지 크기가 너무 큽니다: ${(image.size / 1024 / 1024).toFixed(2)}MB. 최대 크기: 10MB`);
    }

    if (image.size < minSize) {
      throw new Error(`이미지가 너무 작습니다: ${image.size} bytes. 최소 크기: 1KB`);
    }

    // 파일 확장자 검증
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExtension = allowedExtensions.some(ext => 
      image.originalname.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      throw new Error(`올바르지 않은 파일 확장자입니다: ${image.originalname}. 지원 확장자: ${allowedExtensions.join(', ')}`);
    }

    console.log(`✅ 이미지 검증 통과: ${image.originalname} (${image.size} bytes, ${image.mimetype})`);
  }

  private validateAndProcessResult(result: ImageExtractResult): ImageExtractResult {
    console.log(`🔍 [UseCase] validateAndProcessResult 시작:`, JSON.stringify(result, null, 2));
    
    // 추출된 번호 검증
    if (!result.numbers || !Array.isArray(result.numbers)) {
      throw new Error('이미지에서 유효한 번호를 추출할 수 없습니다.');
    }

    // 2차원 배열 처리 (게임별 번호 세트)
    const validGames: number[][] = [];
    const allNumbers: number[] = [];

    for (let i = 0; i < result.numbers.length; i++) {
      const game = result.numbers[i];
      
      if (!Array.isArray(game)) {
        console.log(`🔍 [UseCase] 게임 ${i + 1}이 배열이 아님:`, game);
        continue;
      }

      // 각 게임에서 유효한 번호만 필터링 (1-45 범위)
      const validNumbers = game.filter(num => 
        typeof num === 'number' && num >= 1 && num <= 45
      );

      console.log(`🔍 [UseCase] 게임 ${i + 1} - 원본:`, game, `유효한 번호:`, validNumbers);

      if (validNumbers.length === 6) {
        // 중복 제거
        const uniqueNumbers = [...new Set(validNumbers)];
        if (uniqueNumbers.length === 6) {
          validGames.push(uniqueNumbers.sort((a, b) => a - b));
          allNumbers.push(...uniqueNumbers);
          console.log(`🔍 [UseCase] 게임 ${i + 1} - 유효한 게임으로 추가:`, uniqueNumbers);
        }
      }
    }

    console.log(`🔍 [UseCase] 최종 유효한 게임:`, validGames);
    console.log(`🔍 [UseCase] 모든 번호:`, allNumbers);

    if (validGames.length === 0) {
      throw new Error('이미지에서 유효한 로또 번호(1-45)를 찾을 수 없습니다.');
    }

    // 신뢰도 검증 및 조정
    let confidence = result.confidence || 0;
    
    if (confidence < 0 || confidence > 100) {
      confidence = Math.max(0, Math.min(100, confidence));
    }

    // 게임 수에 따른 신뢰도 조정
    if (validGames.length >= 3) {
      confidence = Math.min(confidence + 10, 100); // 여러 게임이면 신뢰도 증가
    }

    const finalResult = {
      numbers: validGames,
      confidence: Math.round(confidence),
      extractedText: result.extractedText || '',
      notes: this.generateNotes(validGames, confidence, result.extractedText),
    };

    console.log(`🔍 [UseCase] 최종 결과:`, JSON.stringify(finalResult, null, 2));
    return finalResult;
  }

  private generateNotes(games: number[][], confidence: number, extractedText?: string): string {
    const notes: string[] = [];

    notes.push(`총 ${games.length}게임이 추출되었습니다.`);

    if (confidence >= 90) {
      notes.push('매우 높은 신뢰도로 추출되었습니다.');
    } else if (confidence >= 70) {
      notes.push('높은 신뢰도로 추출되었습니다.');
    } else if (confidence >= 50) {
      notes.push('보통 신뢰도로 추출되었습니다.');
    } else {
      notes.push('낮은 신뢰도로 추출되었습니다. 확인이 필요합니다.');
    }

    // 각 게임의 번호 개수 확인
    const incompleteGames = games.filter(game => game.length !== 6);
    if (incompleteGames.length > 0) {
      notes.push(`${incompleteGames.length}게임이 완전하지 않습니다.`);
    }

    // 전체 번호 개수
    const totalNumbers = games.reduce((sum, game) => sum + game.length, 0);
    notes.push(`총 ${totalNumbers}개의 번호가 추출되었습니다.`);

    if (!extractedText || extractedText.trim().length === 0) {
      notes.push('이미지에서 텍스트 정보를 추출하지 못했습니다.');
    }

    return notes.join(' ');
  }
} 