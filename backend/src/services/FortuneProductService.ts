/**
 * Fortune product service — catalog lives in src/data/fortuneProducts.ts
 */
import {
  FortuneProductType,
  FortuneCategory,
  FortuneProduct,
  ChatEntitlementDays,
} from '../types/fortune';
import {
  DOCUMENT_PRICES,
  DISCOUNT_RATES,
  PRODUCT_DESCRIPTIONS,
  PRODUCT_NAMES,
  CATEGORY_NAMES,
  DOCUMENT_PRODUCT_NAMES,
  CHAT_ENTITLEMENT_DAYS,
  getChatEntitlementAmount,
} from '../data/fortuneProducts';
import { calculateFinalAmount } from '../utils/priceCalculator';

/** TS shape only; real session category is on Order.metadata */
const CHAT_PRODUCT_CATEGORY_PLACEHOLDER = FortuneCategory.SAJU;

export class FortuneProductService {
  private generateDocumentProductId(category: FortuneCategory): string {
    const timestamp = Date.now().toString(36);
    return `prod_${FortuneProductType.DOCUMENT_REPORT}_${category}_${timestamp}`;
  }

  /** Global chat pass: 1 / 7 / 30 days (same price for all categories) */
  getChatEntitlementProduct(days: ChatEntitlementDays): FortuneProduct {
    const baseAmount = getChatEntitlementAmount(days);
    const discountRate = 0;
    const finalAmount = calculateFinalAmount(baseAmount, discountRate);
    const productId = `prod_chat_topup_${days}d_global`;
    const durationLabel = days === 30 ? '1개월' : `${days}일`;

    return {
      productId,
      type: FortuneProductType.CHAT_SESSION,
      category: CHAT_PRODUCT_CATEGORY_PLACEHOLDER,
      name: `채팅 이용권 (${durationLabel})`,
      amount: baseAmount,
      discountRate,
      finalAmount,
      description: `구매 시점부터 ${durationLabel} 동안 계정 기준으로 채팅 상담을 이용할 수 있어요.`,
      entitlementDays: days,
    };
  }

  /** Document product only; chat uses getChatEntitlementProduct */
  getProduct(productType: FortuneProductType, category: FortuneCategory): FortuneProduct {
    const categoryName = CATEGORY_NAMES[category];

    if (productType === FortuneProductType.CHAT_SESSION) {
      throw new Error('Use getChatEntitlementProduct(1|7|30) for chat SKUs.');
    }

    const baseAmount = DOCUMENT_PRICES[category];
    const discountRate =
      DISCOUNT_RATES[category]?.documentDiscountRate ??
      DISCOUNT_RATES[category]?.defaultDiscountRate ??
      0;
    const finalAmount = calculateFinalAmount(baseAmount, discountRate);
    const productId = this.generateDocumentProductId(category);

    return {
      productId,
      type: FortuneProductType.DOCUMENT_REPORT,
      category,
      name:
        DOCUMENT_PRODUCT_NAMES[category] ||
        PRODUCT_NAMES[FortuneProductType.DOCUMENT_REPORT](categoryName),
      amount: baseAmount,
      discountRate,
      finalAmount,
      description: PRODUCT_DESCRIPTIONS[FortuneProductType.DOCUMENT_REPORT](categoryName),
    };
  }

  /** Per category: three global chat passes + one document SKU */
  getProductsByCategory(category: FortuneCategory): FortuneProduct[] {
    const products: FortuneProduct[] = [];

    for (const days of CHAT_ENTITLEMENT_DAYS) {
      products.push(this.getChatEntitlementProduct(days));
    }

    products.push(this.getProduct(FortuneProductType.DOCUMENT_REPORT, category));

    return products;
  }

  getAllProducts(): Record<FortuneCategory, FortuneProduct[]> {
    const result: Partial<Record<FortuneCategory, FortuneProduct[]>> = {};

    for (const c of Object.values(FortuneCategory)) {
      result[c] = this.getProductsByCategory(c);
    }

    return result as Record<FortuneCategory, FortuneProduct[]>;
  }

  getCategoryName(category: FortuneCategory): string {
    return CATEGORY_NAMES[category] || category;
  }
}
