import { IGPTService } from '../repositories/IGPTService';
import { UploadedFile, ImageExtractResult } from '../types/common';

export class ExtractImageNumbersUseCase {
  constructor(private readonly gptService: IGPTService) {}

  async execute(image: UploadedFile): Promise<ImageExtractResult> {
    // 1. 이미지 검증
    this.validateImage(image);

    // 2. GPT를 통한 번호 추출
    const result = await this.gptService.extractNumbersFromImage(image);

    // 3. 결과 검증 및 후처리
    return this.validateAndProcessResult(result);
  }

  private validateImage(image: UploadedFile): void {
    if (!image) {
      throw new Error('이미지가 제공되지 않았습니다.');
    }

    if (!image.buffer || image.buffer.length === 0) {
      throw new Error('이미지 데이터가 비어 있습니다.');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const minSize = 1024; // 1KB

    if (!allowedMimeTypes.includes(image.mimetype)) {
      throw new Error('지원하지 않는 이미지 형식입니다. JPEG, PNG, WebP만 가능합니다.');
    }

    if (image.size > maxSize) {
      throw new Error('이미지 크기는 10MB 이하여야 합니다.');
    }

    if (image.size < minSize) {
      throw new Error('이미지가 너무 작습니다. 최소 1KB 이상이어야 합니다.');
    }

    // 파일 확장자 검증
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExtension = allowedExtensions.some(ext => 
      image.originalname.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      throw new Error('올바르지 않은 파일 확장자입니다.');
    }
  }

  private validateAndProcessResult(result: ImageExtractResult): ImageExtractResult {
    // 추출된 번호 검증
    if (!result.numbers || !Array.isArray(result.numbers)) {
      throw new Error('이미지에서 유효한 번호를 추출할 수 없습니다.');
    }

    // 유효한 번호만 필터링 (1-45 범위)
    const validNumbers = result.numbers.filter(num => 
      typeof num === 'number' && num >= 1 && num <= 45
    );

    if (validNumbers.length === 0) {
      throw new Error('이미지에서 유효한 로또 번호(1-45)를 찾을 수 없습니다.');
    }

    // 중복 제거
    const uniqueNumbers = [...new Set(validNumbers)];

    // 신뢰도 검증 및 조정
    let confidence = result.confidence || 0;
    
    if (confidence < 0 || confidence > 100) {
      confidence = Math.max(0, Math.min(100, confidence));
    }

    // 번호 개수에 따른 신뢰도 조정
    if (uniqueNumbers.length < 3) {
      confidence = Math.min(confidence, 60); // 번호가 적으면 신뢰도 감소
    } else if (uniqueNumbers.length === 6) {
      confidence = Math.min(confidence + 10, 100); // 완전한 세트면 신뢰도 증가
    }

    return {
      numbers: uniqueNumbers.slice(0, 6), // 최대 6개까지만
      confidence: Math.round(confidence),
      extractedText: result.extractedText || '',
      notes: this.generateNotes(uniqueNumbers, confidence, result.extractedText),
    };
  }

  private generateNotes(numbers: number[], confidence: number, extractedText?: string): string {
    const notes: string[] = [];

    notes.push(`${numbers.length}개의 번호가 추출되었습니다.`);

    if (confidence >= 90) {
      notes.push('매우 높은 신뢰도로 추출되었습니다.');
    } else if (confidence >= 70) {
      notes.push('높은 신뢰도로 추출되었습니다.');
    } else if (confidence >= 50) {
      notes.push('보통 신뢰도로 추출되었습니다.');
    } else {
      notes.push('낮은 신뢰도로 추출되었습니다. 확인이 필요합니다.');
    }

    if (numbers.length < 6) {
      notes.push('완전한 로또 세트(6개)보다 적은 번호가 추출되었습니다.');
    }

    if (!extractedText || extractedText.trim().length === 0) {
      notes.push('이미지에서 텍스트 정보를 추출하지 못했습니다.');
    }

    return notes.join(' ');
  }
} 