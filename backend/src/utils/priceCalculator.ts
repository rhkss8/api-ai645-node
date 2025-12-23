/**
 * 결제 가격 계산 유틸리티
 * 프론트엔드와 백엔드에서 동일한 계산식을 사용하기 위한 유틸리티
 */

/**
 * 할인율을 적용한 최종 결제 금액 계산 (10원 단위 절삭)
 * 
 * @param baseAmount 원래 가격 (원)
 * @param discountRate 할인율 (0~100, 예: 33 = 33% 할인)
 * @returns 최종 결제 금액 (10원 단위로 절삭된 금액)
 * 
 * @example
 * calculateFinalAmount(15000, 33) // 15000 * 0.67 = 10050원
 * calculateFinalAmount(15000, 33) // 15000 * 0.67 = 10053원이면 10050원으로 절삭
 */
export function calculateFinalAmount(
  baseAmount: number,
  discountRate: number
): number {
    const discountedAmount = baseAmount * (100 - discountRate);
    const finalAmount = Math.floor(discountedAmount / 10000) * 100;
    return finalAmount;
}

/**
 * 할인 금액 계산
 * 
 * @param baseAmount 원래 가격 (원)
 * @param discountRate 할인율 (0~100)
 * @returns 할인 금액 (원)
 */
export function calculateDiscountAmount(
  baseAmount: number,
  discountRate: number
): number {
  return baseAmount - calculateFinalAmount(baseAmount, discountRate);
}

/**
 * 할인율 검증
 * 
 * @param discountRate 할인율
 * @returns 유효한 할인율인지 여부
 */
export function isValidDiscountRate(discountRate: number): boolean {
  return discountRate >= 0 && discountRate <= 100;
}

