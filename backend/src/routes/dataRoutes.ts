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
   *       404:
   *         description: 추천을 찾을 수 없음
   *       429:
   *         description: 요청 한도 초과
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
   *       429:
   *         description: 요청 한도 초과
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
   *       400:
   *         description: 잘못된 회차 번호
   *       429:
   *         description: 요청 한도 초과
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
   *       429:
   *         description: 요청 한도 초과
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
   *       404:
   *         description: 당첨번호 데이터가 없음
   *       429:
   *         description: 요청 한도 초과
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
   *       404:
   *         description: 해당 회차 당첨번호를 찾을 수 없음
   *       429:
   *         description: 요청 한도 초과
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
   *       429:
   *         description: 요청 한도 초과
   */
  router.get(
    '/winning-numbers/recent',
    dataQueryLimiter,
    controller.getRecentWinningNumbers,
  );

  return router;
}; 