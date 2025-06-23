import { Router } from 'express';
import { DataController } from '../controllers/DataController';
import {
  validateIdParam,
  validateRoundParam,
  validatePaginationQuery,
} from '../middlewares/validation';
import { dataQueryLimiter } from '../middlewares/rateLimiter';

export const createDataRoutes = (controller: DataController): Router => {
  const router = Router();

  // 추천 관련 라우트
  /**
   * @swagger
   * /api/data/recommendations/{id}:
   *   get:
   *     summary: 특정 추천 조회
   *     description: ID로 특정 추천 내역 조회
   *     tags: [Data]
   *     parameters:
   *       - in: path
   *         name: id
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
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "rec_abc123"
   *                       description: 추천 ID
   *                     type:
   *                       type: string
   *                       enum: [FREE, PREMIUM]
   *                       example: "PREMIUM"
   *                       description: 추천 타입
   *                     round:
   *                       type: integer
   *                       example: 1150
   *                       description: 대상 회차
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
   *                       example: [[1, 7, 14, 21, 28, 35], [3, 12, 19, 26, 33, 40]]
   *                       description: 추천된 번호 세트들
   *                     conditions:
   *                       type: object
   *                       description: 사용자 조건 (선택사항)
   *                     imageData:
   *                       type: object
   *                       description: 이미지 분석 결과 (선택사항)
   *                     gptModel:
   *                       type: string
   *                       example: "gpt-4o"
   *                       description: 사용된 GPT 모델
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-06-23T07:45:28.502Z"
   *                       description: 생성 시간
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
    '/recommendations/:id',
    dataQueryLimiter,
    validateIdParam,
    controller.getRecommendationById,
  );

  /**
   * @swagger
   * /api/data/recommendations:
   *   get:
   *     summary: 추천 목록 조회 (페이지네이션)
   *     description: 모든 추천을 페이지네이션으로 조회
   *     tags: [Data]
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
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [FREE, PREMIUM]
   *         description: 추천 타입 필터
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
   *                         example: "rec_abc123"
   *                       type:
   *                         type: string
   *                         enum: [FREE, PREMIUM]
   *                         example: "PREMIUM"
   *                       round:
   *                         type: integer
   *                         example: 1150
   *                       numbers:
   *                         type: array
   *                         items:
   *                           type: array
   *                           items:
   *                             type: integer
   *                         example: [[1, 7, 14, 21, 28, 35], [3, 12, 19, 26, 33, 40]]
   *                       conditions:
   *                         type: object
   *                         description: 사용자 조건
   *                       imageData:
   *                         type: object
   *                         description: 이미지 분석 결과
   *                       gptModel:
   *                         type: string
   *                         example: "gpt-4o"
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
   *                       example: 50
   *                     totalPages:
   *                       type: integer
   *                       example: 5
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
    '/recommendations',
    dataQueryLimiter,
    validatePaginationQuery,
    controller.getRecommendations,
  );

  /**
   * @swagger
   * /api/data/recommendations/round/{round}:
   *   get:
   *     summary: 회차별 추천 조회
   *     description: 특정 회차의 모든 추천 조회
   *     tags: [Data]
   *     parameters:
   *       - in: path
   *         name: round
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 9999
   *         description: 회차 번호
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
   *                         example: "rec_abc123"
   *                       type:
   *                         type: string
   *                         enum: [FREE, PREMIUM]
   *                         example: "FREE"
   *                       round:
   *                         type: integer
   *                         example: 1150
   *                       numbers:
   *                         type: array
   *                         items:
   *                           type: array
   *                           items:
   *                             type: integer
   *                         example: [[1, 7, 14, 21, 28, 35]]
   *                       conditions:
   *                         type: object
   *                         description: 사용자 조건
   *                       gptModel:
   *                         type: string
   *                         example: "gpt-3.5-turbo"
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-06-23T07:45:28.502Z"
   *                 message:
   *                   type: string
   *                   example: "1150회차에 대한 추천 목록입니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: 잘못된 회차 번호
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
   *                   example: "회차는 1-9999 사이의 숫자여야 합니다."
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
    '/recommendations/round/:round',
    dataQueryLimiter,
    validateRoundParam,
    controller.getRecommendationsByRound,
  );

  /**
   * @swagger
   * /api/data/recommendations/recent:
   *   get:
   *     summary: 최근 추천 목록 조회
   *     description: 최근 추천을 조회 (기본 10개)
   *     tags: [Data]
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
   *                         example: "rec_abc123"
   *                       type:
   *                         type: string
   *                         enum: [FREE, PREMIUM]
   *                         example: "PREMIUM"
   *                       round:
   *                         type: integer
   *                         example: 1150
   *                       numbers:
   *                         type: array
   *                         items:
   *                           type: array
   *                           items:
   *                             type: integer
   *                         example: [[1, 7, 14, 21, 28, 35], [3, 12, 19, 26, 33, 40]]
   *                       gptModel:
   *                         type: string
   *                         example: "gpt-4o"
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-06-23T07:45:28.502Z"
   *                 message:
   *                   type: string
   *                   example: "최근 10개의 추천입니다."
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
    '/recommendations/recent',
    dataQueryLimiter,
    controller.getRecentRecommendations,
  );

  // 당첨번호 관련 라우트
  /**
   * @swagger
   * /api/data/winning-numbers/latest:
   *   get:
   *     summary: 최신 당첨번호 조회
   *     description: 가장 최근 당첨번호 조회
   *     tags: [Data]
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
   *                       example: "win_abc123"
   *                       description: 당첨번호 ID
   *                     round:
   *                       type: integer
   *                       example: 1150
   *                       description: 회차
   *                     numbers:
   *                       type: array
   *                       items:
   *                         type: integer
   *                         minimum: 1
   *                         maximum: 45
   *                       minItems: 7
   *                       maxItems: 7
   *                       example: [1, 7, 14, 21, 28, 35, 42]
   *                       description: 당첨번호 (보너스번호 포함)
   *                     drawDate:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-06-21T20:00:00.000Z"
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-06-21T20:30:00.000Z"
   *                 message:
   *                   type: string
   *                   example: "최신 당첨번호입니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: 당첨번호 데이터가 없음
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
   *                   example: "당첨번호 데이터가 없습니다."
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
    '/winning-numbers/latest',
    dataQueryLimiter,
    controller.getLatestWinningNumbers,
  );

  /**
   * @swagger
   * /api/data/winning-numbers/round/{round}:
   *   get:
   *     summary: 회차별 당첨번호 조회
   *     description: 특정 회차의 당첨번호 조회
   *     tags: [Data]
   *     parameters:
   *       - in: path
   *         name: round
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 9999
   *         description: 회차 번호
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
   *                       example: "win_abc123"
   *                       description: 당첨번호 ID
   *                     round:
   *                       type: integer
   *                       example: 1150
   *                       description: 회차
   *                     numbers:
   *                       type: array
   *                       items:
   *                         type: integer
   *                         minimum: 1
   *                         maximum: 45
   *                       minItems: 7
   *                       maxItems: 7
   *                       example: [1, 7, 14, 21, 28, 35, 42]
   *                       description: 당첨번호 (보너스번호 포함)
   *                     drawDate:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-06-21T20:00:00.000Z"
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-06-21T20:30:00.000Z"
   *                 message:
   *                   type: string
   *                   example: "1150회차 당첨번호입니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: 해당 회차 당첨번호를 찾을 수 없음
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
   *                   example: "1150회차 당첨번호를 찾을 수 없습니다."
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
    '/winning-numbers/round/:round',
    dataQueryLimiter,
    validateRoundParam,
    controller.getWinningNumbersByRound,
  );

  /**
   * @swagger
   * /api/data/winning-numbers/recent:
   *   get:
   *     summary: 최근 당첨번호 목록 조회
   *     description: 최근 당첨번호들을 조회 (기본 10개)
   *     tags: [Data]
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
   *                         example: "win_abc123"
   *                       round:
   *                         type: integer
   *                         example: 1150
   *                       numbers:
   *                         type: array
   *                         items:
   *                           type: integer
   *                         example: [1, 7, 14, 21, 28, 35, 42]
   *                       drawDate:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-06-21T20:00:00.000Z"
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-06-21T20:30:00.000Z"
   *                 message:
   *                   type: string
   *                   example: "최근 10개의 당첨번호입니다."
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
    '/winning-numbers/recent',
    dataQueryLimiter,
    controller.getRecentWinningNumbers,
  );

  return router;
}; 