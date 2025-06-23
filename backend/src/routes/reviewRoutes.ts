import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController';
import {
  validateReviewRequest,
  validateIdParam,
  validatePaginationQuery,
} from '../middlewares/validation';
import {
  reviewGenerationLimiter,
  dataQueryLimiter,
} from '../middlewares/rateLimiter';

export const createReviewRoutes = (controller: ReviewController): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/review/generate:
   *   post:
   *     summary: 회고 분석 생성
   *     description: 추천 결과와 당첨번호를 비교하여 AI 회고 분석 생성
   *     tags: [Reviews]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - recommendationId
   *               - winningNumbers
   *             properties:
   *               recommendationId:
   *                 type: string
   *                 description: 분석할 추천의 ID
   *               winningNumbers:
   *                 type: array
   *                 items:
   *                   type: integer
   *                   minimum: 1
   *                   maximum: 45
   *                 minItems: 7
   *                 maxItems: 7
   *                 description: 당첨번호 7개 (보너스번호 포함)
   *     responses:
   *       201:
   *         description: 회고 생성 성공
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
   *                     id:
   *                       type: string
   *                       example: "review_abc123"
   *                       description: 회고 ID
   *                     recommendationId:
   *                       type: string
   *                       example: "rec_xyz789"
   *                       description: 분석된 추천 ID
   *                     winningNumbers:
   *                       type: array
   *                       items:
   *                         type: integer
   *                         minimum: 1
   *                         maximum: 45
   *                       minItems: 7
   *                       maxItems: 7
   *                       example: [1, 7, 14, 21, 28, 35, 42]
   *                       description: 당첨번호 (보너스번호 포함)
   *                     matchedCounts:
   *                       type: array
   *                       items:
   *                         type: integer
   *                         minimum: 0
   *                         maximum: 6
   *                       example: [3, 2, 4, 1, 0]
   *                       description: 각 세트별 일치 개수
   *                     reviewText:
   *                       type: string
   *                       example: "이번 추천에서는 3등 당첨이 1건 나왔습니다. 전체적으로 중간 구간 번호가 많이 일치했습니다..."
   *                       description: AI 생성 회고 분석 텍스트
   *                     analysisPrompt:
   *                       type: string
   *                       example: "추천 분석: PREMIUM 타입, GPT 모델: gpt-4o, 당첨번호: [1, 7, 14, 21, 28, 35, 42]"
   *                       description: 분석에 사용된 프롬프트
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-06-23T07:45:28.502Z"
   *                       description: 생성 시간
   *                 message:
   *                   type: string
   *                   example: "회고 분석이 완료되었습니다."
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
   *                   example: "당첨번호는 7개(보너스번호 포함)여야 합니다."
   *                 data:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                       example: "BUSINESS_LOGIC_ERROR"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: 추천을 찾을 수 없음
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
   *                   example: "추천 내역을 찾을 수 없습니다."
   *                 data:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                       example: "NOT_FOUND"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       429:
   *         description: 요청 한도 초과
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
   *                   example: "회고 생성 요청 한도를 초과했습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  router.post(
    '/generate',
    reviewGenerationLimiter,
    validateReviewRequest,
    controller.generateReview,
  );

  /**
   * @swagger
   * /api/review/{id}:
   *   get:
   *     summary: 특정 회고 조회
   *     description: ID로 특정 회고 조회
   *     tags: [Reviews]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 회고 ID
   *     responses:
   *       200:
   *         description: 조회 성공
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
   *                     id:
   *                       type: string
   *                       example: "review_abc123"
   *                     recommendationId:
   *                       type: string
   *                       example: "rec_xyz789"
   *                     winningNumbers:
   *                       type: array
   *                       items:
   *                         type: integer
   *                       example: [1, 7, 14, 21, 28, 35, 42]
   *                     matchedCounts:
   *                       type: array
   *                       items:
   *                         type: integer
   *                       example: [3, 2, 4, 1, 0]
   *                     reviewText:
   *                       type: string
   *                       example: "이번 추천에서는 3등 당첨이 1건 나왔습니다..."
   *                     analysisPrompt:
   *                       type: string
   *                       example: "추천 분석: PREMIUM 타입..."
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-06-23T07:45:28.502Z"
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: 회고를 찾을 수 없음
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
   *                   example: "회고를 찾을 수 없습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       429:
   *         description: 요청 한도 초과
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
   *                   example: "데이터 조회 요청 한도를 초과했습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  router.get(
    '/:id',
    dataQueryLimiter,
    validateIdParam,
    controller.getReviewById,
  );

  /**
   * @swagger
   * /api/review/recommendation/{recommendationId}:
   *   get:
   *     summary: 추천별 회고 목록 조회
   *     description: 특정 추천에 대한 모든 회고 조회
   *     tags: [Reviews]
   *     parameters:
   *       - in: path
   *         name: recommendationId
   *         required: true
   *         schema:
   *           type: string
   *         description: 추천 ID
   *     responses:
   *       200:
   *         description: 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         example: "review_abc123"
   *                       recommendationId:
   *                         type: string
   *                         example: "rec_xyz789"
   *                       winningNumbers:
   *                         type: array
   *                         items:
   *                           type: integer
   *                         example: [1, 7, 14, 21, 28, 35, 42]
   *                       matchedCounts:
   *                         type: array
   *                         items:
   *                           type: integer
   *                         example: [3, 2, 4, 1, 0]
   *                       reviewText:
   *                         type: string
   *                         example: "이번 추천에서는 3등 당첨이 1건 나왔습니다..."
   *                       analysisPrompt:
   *                         type: string
   *                         example: "추천 분석: PREMIUM 타입..."
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-06-23T07:45:28.502Z"
   *                 message:
   *                   type: string
   *                   example: "추천 ID rec_xyz789에 대한 회고 목록입니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       429:
   *         description: 요청 한도 초과
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
   *                   example: "데이터 조회 요청 한도를 초과했습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  router.get(
    '/recommendation/:recommendationId',
    dataQueryLimiter,
    validateIdParam,
    controller.getReviewsByRecommendationId,
  );

  /**
   * @swagger
   * /api/review:
   *   get:
   *     summary: 회고 목록 조회 (페이지네이션)
   *     description: 모든 회고를 페이지네이션으로 조회
   *     tags: [Reviews]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 페이지 번호
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: 페이지 크기
   *     responses:
   *       200:
   *         description: 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         example: "review_abc123"
   *                       recommendationId:
   *                         type: string
   *                         example: "rec_xyz789"
   *                       winningNumbers:
   *                         type: array
   *                         items:
   *                           type: integer
   *                         example: [1, 7, 14, 21, 28, 35, 42]
   *                       matchedCounts:
   *                         type: array
   *                         items:
   *                           type: integer
   *                         example: [3, 2, 4, 1, 0]
   *                       reviewText:
   *                         type: string
   *                         example: "이번 추천에서는 3등 당첨이 1건 나왔습니다..."
   *                       analysisPrompt:
   *                         type: string
   *                         example: "추천 분석: PREMIUM 타입..."
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-06-23T07:45:28.502Z"
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                       example: 1
   *                     limit:
   *                       type: integer
   *                       example: 10
   *                     total:
   *                       type: integer
   *                       example: 25
   *                     totalPages:
   *                       type: integer
   *                       example: 3
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       429:
   *         description: 요청 한도 초과
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
   *                   example: "데이터 조회 요청 한도를 초과했습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  router.get(
    '/',
    dataQueryLimiter,
    validatePaginationQuery,
    controller.getReviews,
  );

  /**
   * @swagger
   * /api/review/recent:
   *   get:
   *     summary: 최근 회고 목록 조회
   *     description: 최근 회고를 조회 (기본 10개)
   *     tags: [Reviews]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: 조회할 개수
   *     responses:
   *       200:
   *         description: 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         example: "review_abc123"
   *                       recommendationId:
   *                         type: string
   *                         example: "rec_xyz789"
   *                       winningNumbers:
   *                         type: array
   *                         items:
   *                           type: integer
   *                         example: [1, 7, 14, 21, 28, 35, 42]
   *                       matchedCounts:
   *                         type: array
   *                         items:
   *                           type: integer
   *                         example: [3, 2, 4, 1, 0]
   *                       reviewText:
   *                         type: string
   *                         example: "이번 추천에서는 3등 당첨이 1건 나왔습니다..."
   *                       analysisPrompt:
   *                         type: string
   *                         example: "추천 분석: PREMIUM 타입..."
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-06-23T07:45:28.502Z"
   *                 message:
   *                   type: string
   *                   example: "최근 10개의 회고입니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       429:
   *         description: 요청 한도 초과
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
   *                   example: "데이터 조회 요청 한도를 초과했습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  router.get(
    '/recent',
    dataQueryLimiter,
    controller.getRecentReviews,
  );

  return router;
}; 