import { Router } from 'express';
import multer from 'multer';
import { RecommendationController } from '../controllers/RecommendationController';
import { IPLimitService } from '../services/IPLimitService';
import {
  validateFreeRecommendationRequest,
  validatePremiumRecommendationRequest,
  validateImageFile,
} from '../middlewares/validation';
import {
  freeRecommendationLimiter,
  premiumRecommendationLimiter,
  imageExtractionLimiter,
} from '../middlewares/rateLimiter';
import { freeRecommendationIPLimit } from '../middlewares/ipLimitMiddleware';
import { authenticateAccess } from '../middlewares/auth';

// Multer 설정 (메모리 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 이미지 형식입니다.'));
    }
  },
});

export const createRecommendationRoutes = (
  controller: RecommendationController,
  ipLimitService: IPLimitService
): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/recommend/free:
   *   post:
   *     summary: 무료 번호 추천
   *     description: GPT-3.5-turbo를 사용한 로또 번호 추천 - 로그인 필요
   *     tags: [Recommendations]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               gameCount:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 default: 5
   *                 description: 추천받을 게임수 (무료는 최대 5게임)
   *               round:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 9999
   *                 description: 대상 회차
   *               conditions:
   *                 type: object
   *                 properties:
   *                   excludeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                     maxItems: 20
   *                     description: 제외할 번호들
   *                   includeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                     maxItems: 6
   *                     description: 포함할 번호들
   *                   preferences:
   *                     type: string
   *                     maxLength: 500
   *                     description: 사용자 선호사항
   *     responses:
   *       200:
   *         description: 추천 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     gameCount:
   *                       type: integer
   *                       example: 5
   *                       description: 생성된 게임수
   *                     numbers:
   *                       type: array
   *                       items:
   *                         type: array
   *                         items:
   *                           type: integer
   *                           minimum: 1
   *                           maximum: 45
   *                         minItems: 6
   *                         maxItems: 6
   *                       example: [[1, 7, 14, 21, 28, 35], [3, 12, 19, 26, 33, 40], [5, 8, 17, 24, 31, 42]]
   *                       description: 추천된 번호 세트들
   *                     round:
   *                       type: integer
   *                       example: 1150
   *                       description: 대상 회차 (선택사항)
   *                     analysis:
   *                       type: string
   *                       example: "이번 추천은 최근 당첨 패턴과 사용자 선호도를 반영하여 생성되었습니다. 홀짝 비율과 구간 분포를 고려했습니다."
   *                 message:
   *                   type: string
   *                   example: "무료 번호 추천이 완료되었습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "게임수는 1-5 사이의 숫자여야 합니다."
   *                 data:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                       example: "BUSINESS_LOGIC_ERROR"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       401:
   *         description: 인증 필요
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "로그인이 필요합니다."
   *                 message:
   *                   type: string
   *                   example: "무료 추천을 사용하려면 로그인이 필요합니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       429:
   *         description: 일일 요청 한도 초과 (IP별 하루 1회 제한)
   *         headers:
   *           X-RateLimit-Limit:
   *             schema:
   *               type: string
   *               example: "60"
   *             description: 최대 허용 요청 수
   *           X-RateLimit-Remaining:
   *             schema:
   *               type: string
   *               example: "0"
   *             description: 남은 요청 수
   *           X-RateLimit-Reset:
   *             schema:
   *               type: string
   *               format: date-time
   *               example: "2025-06-24T00:00:00.000Z"
   *             description: 다음 요청 가능 시간
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "일일 무료 추천 한도를 초과했습니다."
   *                 message:
   *                   type: string
   *                   example: "무료 추천은 하루에 한 번만 가능합니다. 12시간 후에 다시 시도해주세요."
   *                 data:
   *                   type: object
   *                   properties:
   *                     nextAllowedTime:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-06-24T00:00:00.000Z"
   *                     remainingHours:
   *                       type: integer
   *                       example: 12
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-06-23T12:00:00.000Z"
   *       500:
   *         description: 서버 오류
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/free',
    authenticateAccess, // 인증 미들웨어 추가
    freeRecommendationLimiter,
    freeRecommendationIPLimit(ipLimitService),
    validateFreeRecommendationRequest,
    controller.generateFreeRecommendation,
  );

  /**
   * @swagger
   * /api/recommend/premium:
   *   post:
   *     summary: 프리미엄 번호 추천
   *     description: GPT-4o를 사용한 고급 로또 번호 추천 (이미지 지원) - 로그인 필요
   *     tags: [Recommendations]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               gameCount:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 10
   *                 default: 5
   *                 description: 추천받을 게임수 (프리미엄은 최대 10게임)
   *               round:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 9999
   *                 description: 대상 회차
   *               conditions:
   *                 type: object
   *                 properties:
   *                   excludeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                     maxItems: 20
   *                     description: 제외할 번호들
   *                   includeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                     maxItems: 6
   *                     description: 포함할 번호들
   *                   preferences:
   *                     type: string
   *                     maxLength: 500
   *                     description: 사용자 선호사항
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: 로또 번호 이미지
   *               data:
   *                 type: string
   *                 description: JSON 형태의 요청 데이터 (gameCount 포함)
   *     responses:
   *       200:
   *         description: 추천 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     gameCount:
   *                       type: integer
   *                       example: 7
   *                       description: 생성된 게임수
   *                     numbers:
   *                       type: array
   *                       items:
   *                         type: array
   *                         items:
   *                           type: integer
   *                           minimum: 1
   *                           maximum: 45
   *                         minItems: 6
   *                         maxItems: 6
   *                       example: [[2, 9, 16, 23, 30, 37], [4, 11, 18, 25, 32, 39], [6, 13, 20, 27, 34, 41]]
   *                       description: 추천된 번호 세트들
   *                     round:
   *                       type: integer
   *                       example: 1150
   *                       description: 대상 회차 (선택사항)
   *                     analysis:
   *                       type: string
   *                       example: "이번 추천은 최근 당첨 패턴과 사용자 선호도를 반영하여 생성되었습니다. 홀짝 비율과 구간 분포를 고려했습니다."
   *                 message:
   *                   type: string
   *                   example: "프리미엄 번호 추천이 완료되었습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-06-23T07:45:28.502Z"
   *       401:
   *         description: 인증 필요
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "로그인이 필요합니다."
   *                 message:
   *                   type: string
   *                   example: "프리미엄 추천을 사용하려면 로그인이 필요합니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "게임수는 1-10 사이의 숫자여야 합니다."
   *                 data:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                       example: "BUSINESS_LOGIC_ERROR"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       429:
   *         description: 요청 한도 초과
   *         headers:
   *           X-RateLimit-Limit:
   *             schema:
   *               type: string
   *               example: "60"
   *             description: 최대 허용 요청 수
   *           X-RateLimit-Remaining:
   *             schema:
   *               type: string
   *               example: "0"
   *             description: 남은 요청 수
   *           X-RateLimit-Reset:
   *             schema:
   *               type: string
   *               format: date-time
   *               example: "2025-06-24T00:00:00.000Z"
   *             description: 다음 요청 가능 시간
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "프리미엄 추천 요청 한도를 초과했습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  router.post(
    '/premium',
    authenticateAccess, // 인증 미들웨어 추가
    premiumRecommendationLimiter,
    validatePremiumRecommendationRequest,
    controller.generatePremiumRecommendation,
  );

  /**
   * @swagger
   * /api/recommend/prepare:
   *   post:
   *     summary: 유료 추천 파라미터 준비
   *     description: 결제 전에 추천 파라미터를 저장합니다
   *     tags: [Recommendations]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [PREMIUM]
   *                 default: PREMIUM
   *               gameCount:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 10
   *                 default: 5
   *               round:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 9999
   *               conditions:
   *                 type: object
   *                 properties:
   *                   excludeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                   includeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                   preferences:
   *                     type: string
   *     responses:
   *       200:
   *         description: 파라미터 저장 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     paramId:
   *                       type: string
   *                     type:
   *                       type: string
   *                     gameCount:
   *                       type: integer
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   */
  router.post(
    '/prepare',
    authenticateAccess,
    premiumRecommendationLimiter,
    controller.prepareRecommendation,
  );

  /**
   * @swagger
   * /api/recommend/generate-from-order/{orderId}:
   *   post:
   *     summary: 결제 완료 후 추천번호 생성
   *     description: 결제가 완료된 주문으로부터 추천번호를 생성합니다
   *     tags: [Recommendations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderId
   *         required: true
   *         schema:
   *           type: string
   *         description: 주문 ID
   *     responses:
   *       200:
   *         description: 추천번호 생성 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     gameCount:
   *                       type: integer
   *                     numbers:
   *                       type: array
   *                       items:
   *                         type: array
   *                         items:
   *                           type: integer
   *                     round:
   *                       type: integer
   *                     analysis:
   *                       type: string
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 주문을 찾을 수 없음
   */
  router.post(
    '/generate-from-order/:orderId',
    authenticateAccess,
    controller.generateFromOrder,
  );

  /**
   * @swagger
   * /api/recommend/regenerate/{orderId}:
   *   post:
   *     summary: 추천번호 재생성
   *     description: 결제 완료된 주문의 추천번호를 재생성합니다
   *     tags: [Recommendations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderId
   *         required: true
   *         schema:
   *           type: string
   *         description: 주문 ID
   *     responses:
   *       200:
   *         description: 추천번호 재생성 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     gameCount:
   *                       type: integer
   *                     numbers:
   *                       type: array
   *                       items:
   *                         type: array
   *                         items:
   *                           type: integer
   *                     round:
   *                       type: integer
   *                     analysis:
   *                       type: string
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 주문을 찾을 수 없음
   */
  router.post(
    '/regenerate/:orderId',
    authenticateAccess,
    controller.regenerateFromOrder,
  );

  return router;
};

export const createImageRoutes = (controller: RecommendationController): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/image/extract:
   *   post:
   *     summary: 이미지에서 번호 추출
   *     description: GPT-4o Vision을 사용하여 이미지에서 로또 번호 추출
   *     tags: [Image Processing]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - image
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: 로또 번호가 포함된 이미지
   *     responses:
   *       200:
   *         description: 추출 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     numbers:
   *                       type: array
   *                       items:
   *                         type: integer
   *                         minimum: 1
   *                         maximum: 45
   *                       example: [1, 7, 14, 21, 28, 35]
   *                       description: 추출된 번호들
   *                     confidence:
   *                       type: number
   *                       minimum: 0
   *                       maximum: 100
   *                       example: 85
   *                       description: 추출 신뢰도 (%)
   *                     extractedText:
   *                       type: string
   *                       example: "로또 번호: 1, 7, 14, 21, 28, 35"
   *                       description: 이미지에서 추출된 텍스트
   *                     notes:
   *                       type: string
   *                       example: "6개의 번호가 높은 신뢰도로 추출되었습니다."
   *                       description: 추출 과정에 대한 메모
   *                 message:
   *                   type: string
   *                   example: "이미지에서 번호 추출이 완료되었습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-06-23T07:45:28.502Z"
   *       400:
   *         description: 잘못된 요청 또는 이미지 형식
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "지원하지 않는 이미지 형식입니다. JPEG, PNG, WebP만 가능합니다."
   *                 data:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                       example: "IMAGE_PROCESSING_ERROR"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       429:
   *         description: 요청 한도 초과
   *         headers:
   *           X-RateLimit-Limit:
   *             schema:
   *               type: string
   *               example: "60"
   *             description: 최대 허용 요청 수
   *           X-RateLimit-Remaining:
   *             schema:
   *               type: string
   *               example: "0"
   *             description: 남은 요청 수
   *           X-RateLimit-Reset:
   *             schema:
   *               type: string
   *               format: date-time
   *               example: "2025-06-24T00:00:00.000Z"
   *             description: 다음 요청 가능 시간
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "이미지 분석 요청 한도를 초과했습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  router.post(
    '/extract',
    imageExtractionLimiter,
    upload.single('image'),
    validateImageFile,
    controller.extractImageNumbers,
  );

  /**
   * @swagger
   * /api/recommend/prepare:
   *   post:
   *     summary: 유료 추천 파라미터 준비
   *     description: 결제 전에 추천 파라미터를 저장합니다
   *     tags: [Recommendations]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [PREMIUM]
   *                 default: PREMIUM
   *               gameCount:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 10
   *                 default: 5
   *               round:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 9999
   *               conditions:
   *                 type: object
   *                 properties:
   *                   excludeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                   includeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                   preferences:
   *                     type: string
   *     responses:
   *       200:
   *         description: 파라미터 저장 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     paramId:
   *                       type: string
   *                     type:
   *                       type: string
   *                     gameCount:
   *                       type: integer
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   */
  router.post(
    '/prepare',
    authenticateAccess,
    premiumRecommendationLimiter,
    controller.prepareRecommendation,
  );

  /**
   * @swagger
   * /api/recommend/generate-from-order/{orderId}:
   *   post:
   *     summary: 결제 완료 후 추천번호 생성
   *     description: 결제가 완료된 주문으로부터 추천번호를 생성합니다
   *     tags: [Recommendations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderId
   *         required: true
   *         schema:
   *           type: string
   *         description: 주문 ID
   *     responses:
   *       200:
   *         description: 추천번호 생성 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     gameCount:
   *                       type: integer
   *                     numbers:
   *                       type: array
   *                       items:
   *                         type: array
   *                         items:
   *                           type: integer
   *                     round:
   *                       type: integer
   *                     analysis:
   *                       type: string
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 주문을 찾을 수 없음
   */
  router.post(
    '/generate-from-order/:orderId',
    authenticateAccess,
    controller.generateFromOrder,
  );

  /**
   * @swagger
   * /api/recommend/regenerate/{orderId}:
   *   post:
   *     summary: 추천번호 재생성
   *     description: 결제 완료된 주문의 추천번호를 재생성합니다
   *     tags: [Recommendations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderId
   *         required: true
   *         schema:
   *           type: string
   *         description: 주문 ID
   *     responses:
   *       200:
   *         description: 추천번호 재생성 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     gameCount:
   *                       type: integer
   *                     numbers:
   *                       type: array
   *                       items:
   *                         type: array
   *                         items:
   *                           type: integer
   *                     round:
   *                       type: integer
   *                     analysis:
   *                       type: string
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 주문을 찾을 수 없음
   */
  router.post(
    '/regenerate/:orderId',
    authenticateAccess,
    controller.regenerateFromOrder,
  );

  return router;
}; 