/**
 * 운세 상품 정보 서비스
 *
 * 상품 데이터는 src/data/fortuneProducts.ts 파일에서 관리합니다.
 */
import { FortuneProductType, FortuneCategory, FortuneProduct, ChatDurationMinutes } from '../types/fortune';
import {
  CHAT_PRICE_PER_MINUTE,
  DOCUMENT_PRICES,
  DISCOUNT_RATES,
  PRODUCT_DESCRIPTIONS,
  PRODUCT_NAMES,
  CATEGORY_NAMES,
  DOCUMENT_PRODUCT_NAMES,
  AVAILABLE_CHAT_DURATIONS,
} from '../data/fortuneProducts';
import { IdGenerator } from '../utils/idGenerator';
import { calculateFinalAmount } from '../utils/priceCalculator';


export class FortuneProductService {
  /**
   * 상품 고유 ID 생성
   */
  private generateProductId(
    productType: FortuneProductType,
    category: FortuneCategory,
    durationMinutes?: number,
  ): string {
    const base = `${productType}_${category}`;
    const duration = durationMinutes ? `_${durationMinutes}min` : '';
    const timestamp = Date.now().toString(36);
    return `prod_${base}${duration}_${timestamp}`;
  }

  /**
   * 상품 정보 조회
   *
   * @param productType 상품 타입
   * @param category 카테고리
   * @param durationMinutes 채팅형일 경우 시간 (5, 10, 30분) - 필수
   */
  getProduct(
    productType: FortuneProductType,
    category: FortuneCategory,
    durationMinutes?: number,
  ): FortuneProduct {
    const categoryName = CATEGORY_NAMES[category];
    const productId = this.generateProductId(productType, category, durationMinutes);

    if (productType === FortuneProductType.CHAT_SESSION) {
      // 채팅형: 시간이 필수
      if (!durationMinutes || !AVAILABLE_CHAT_DURATIONS.includes(durationMinutes as any)) {
        throw new Error(`채팅형은 시간이 필수입니다. (5, 10, 30분 중 선택)`);
      }

      // 기본 가격 계산 (분당 가격 * 시간)
      const pricePerMinute = CHAT_PRICE_PER_MINUTE[category];
      const baseAmount = pricePerMinute * durationMinutes;

      // 할인률 조회
      const discountRate = DISCOUNT_RATES[category]?.chat?.[durationMinutes]
        || DISCOUNT_RATES[category]?.default
        || 0;

      // 실제 결제 금액 계산 (10원 단위 절삭)
      const finalAmount = calculateFinalAmount(baseAmount, discountRate);

      return {
        productId,
        type: FortuneProductType.CHAT_SESSION,
        category,
        name: `${categoryName} 채팅 상담 (${durationMinutes}분)`,
        amount: baseAmount,
        discountRate,
        finalAmount,
        description: PRODUCT_DESCRIPTIONS[FortuneProductType.CHAT_SESSION](
          categoryName,
          durationMinutes * 60, // 초 단위로 변환
        ),
        duration: durationMinutes * 60, // 초 단위
      };
    } else {
      // 문서형
      const baseAmount = DOCUMENT_PRICES[category];
      const discountRate = DISCOUNT_RATES[category]?.document
        || DISCOUNT_RATES[category]?.default
        || 0;

      // 실제 결제 금액 계산 (10원 단위 절삭)
      const finalAmount = calculateFinalAmount(baseAmount, discountRate);

      return {
        productId,
        type: FortuneProductType.DOCUMENT_REPORT,
        category,
        name: DOCUMENT_PRODUCT_NAMES[category] || PRODUCT_NAMES[FortuneProductType.DOCUMENT_REPORT](categoryName),
        amount: baseAmount,
        discountRate,
        finalAmount,
        description: PRODUCT_DESCRIPTIONS[FortuneProductType.DOCUMENT_REPORT](categoryName),
      };
    }
  }

  /**
   * 카테고리별 상품 목록 조회
   * 채팅형은 5분/10분/30분 모두 포함
   */
  getProductsByCategory(category: FortuneCategory): FortuneProduct[] {
    const products: FortuneProduct[] = [];

    // 채팅형 상품들 (5분, 10분, 30분)
    for (const duration of AVAILABLE_CHAT_DURATIONS) {
      products.push(
        this.getProduct(FortuneProductType.CHAT_SESSION, category, duration),
      );
    }

    // 문서형 상품
    products.push(
      this.getProduct(FortuneProductType.DOCUMENT_REPORT, category),
    );

    return products;
  }

  /**
   * 모든 카테고리의 상품 목록 조회
   */
  getAllProducts(): Record<FortuneCategory, FortuneProduct[]> {
    const result: Partial<Record<FortuneCategory, FortuneProduct[]>> = {};

    for (const category of Object.values(FortuneCategory)) {
      result[category] = this.getProductsByCategory(category);
    }

    return result as Record<FortuneCategory, FortuneProduct[]>;
  }

  /**
   * 카테고리 한글명 조회
   */
  getCategoryName(category: FortuneCategory): string {
    return CATEGORY_NAMES[category] || category;
  }
}
