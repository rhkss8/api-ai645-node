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
   *       400:
   *         description: 잘못된 요청
   *       404:
   *         description: 추천을 찾을 수 없음
   *       429:
   *         description: 요청 한도 초과
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
   *       404:
   *         description: 회고를 찾을 수 없음
   *       429:
   *         description: 요청 한도 초과
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
   *       429:
   *         description: 요청 한도 초과
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
   *       429:
   *         description: 요청 한도 초과
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
   *       429:
   *         description: 요청 한도 초과
   */
  router.get(
    '/recent',
    dataQueryLimiter,
    controller.getRecentReviews,
  );

  return router;
}; 