import { Router } from 'express';
import { DataController } from '../controllers/DataController';
import {
  validateIdParam,
  validateRoundParam,
  validatePaginationQuery,
} from '../middlewares/validation';
import { dataQueryLimiter } from '../middlewares/rateLimiter';
import { authenticateAccess } from '../middlewares/auth';
import { LottoScheduler } from '../batch/LottoScheduler';
import { ApiResponse } from '../types/common';

export const createDataRoutes = (controller: DataController): Router => {
  const router = Router();

  // 개발용 IP 제한 초기화 라우트 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    /**
     * @swagger
     * /api/data/dev/reset-ip-limits:
     *   post:
     *     summary: IP 제한 초기화 (개발용)
     *     description: 모든 IP 제한 기록을 초기화합니다. 개발 환경에서만 사용 가능합니다.
     *     tags: [Data]
     *     responses:
     *       200:
     *         description: 초기화 성공
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "모든 IP 제한이 초기화되었습니다."
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *       403:
     *         description: 개발 환경에서만 사용 가능
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
     *                   example: "개발 환경에서만 사용 가능합니다."
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     */
    router.post('/dev/reset-ip-limits', controller.resetIPLimits);
  }

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
   *                       example: [[1, 7, 14, 21, 28, 35], [3, 12, 19, 26, 33, 40]]
   *                       description: 추천된 번호 세트들
   *                     conditions:
   *                       type: object
   *                       description: 사용자 조건 (선택사항)
   *                     imageData:
   *                       type: object
   *                       description: 이미지 분석 결과 (선택사항)
   *                     winningNumbers:
   *                       type: object
   *                       nullable: true
   *                       description: 해당 회차의 당첨번호 정보
   *                       properties:
   *                         id:
   *                           type: string
   *                           example: "win_abc123"
   *                           description: 당첨번호 레코드 ID
   *                         round:
   *                           type: integer
   *                           example: 1150
   *                           description: 회차
   *                         numbers:
   *                           type: array
   *                           items:
   *                             type: integer
   *                             minimum: 1
   *                             maximum: 45
   *                           example: [1, 7, 14, 21, 28, 35]
   *                           description: 당첨번호
   *                         bonusNumber:
   *                           type: integer
   *                           example: 42
   *                           description: 보너스 번호
   *                         firstWinningAmount:
   *                           type: string
   *                           example: "2000000000"
   *                           description: 1등 당첨금
   *                         drawDate:
   *                           type: string
   *                           format: date-time
   *                           example: "2025-06-21T00:00:00.000Z"
   *                           description: 추첨일
   *                         createdAt:
   *                           type: string
   *                           format: date-time
   *                           example: "2025-06-23T07:45:28.502Z"
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
   *                   example: "데이터 조회 요청 한도를 초과했습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  /**
   * @swagger
   * /api/data/recommendations/my:
   *   get:
   *     summary: 내 추천 이력 조회
   *     description: 로그인한 사용자의 추천 이력을 조회합니다.
   *     tags: [Data]
   *     security:
   *       - bearerAuth: []
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
   *           maximum: 50
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
   *                         description: 추천 ID
   *                       type:
   *                         type: string
   *                         enum: [FREE, PREMIUM]
   *                         example: "PREMIUM"
   *                         description: 추천 타입
   *                       round:
   *                         type: integer
   *                         example: 1150
   *                         description: 대상 회차
   *                       numbers:
   *                         type: array
   *                         items:
   *                           type: array
   *                           items:
   *                             type: integer
   *                       example: [[1, 7, 14, 21, 28, 35], [3, 12, 19, 26, 33, 40]]
   *                       description: 추천된 번호 세트들
   *                       conditions:
   *                         type: object
   *                         description: 사용자 조건 (선택사항)
   *                       imageData:
   *                         type: object
   *                         description: 이미지 분석 결과 (선택사항)
   *                       winningNumbers:
   *                         type: object
   *                         nullable: true
   *                         description: 해당 회차의 당첨번호 정보
   *                       winStatus:
   *                         type: string
   *                         enum: [WIN, LOSE, PENDING]
   *                         description: 당첨상태
   *                       matchCounts:
   *                         type: array
   *                         items:
   *                           type: integer
   *                         description: 각 세트별 맞은 개수
   *                       maxMatchCount:
   *                         type: integer
   *                         description: 최대 맞은 개수
   *                       bestRank:
   *                         type: integer
   *                         description: 최고 등수
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         description: 생성일
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                       example: 1
   *                       description: 현재 페이지
   *                     limit:
   *                       type: integer
   *                       example: 10
   *                       description: 페이지 크기
   *                     total:
   *                       type: integer
   *                       example: 25
   *                       description: 전체 데이터 수
   *                     totalPages:
   *                       type: integer
   *                       example: 3
   *                       description: 전체 페이지 수
   *                 message:
   *                   type: string
   *                   example: "내 추천 이력 10개를 조회했습니다."
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
   *                   example: "데이터 조회 요청 한도를 초과했습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  router.get(
    '/recommendations/my',
    authenticateAccess,
    dataQueryLimiter,
    controller.getUserRecommendations,
  );

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
   *                       example: [[1, 7, 14, 21, 28, 35], [3, 12, 19, 26, 33, 40]]
   *                       description: 추천된 번호 세트들
   *                     conditions:
   *                       type: object
   *                       description: 사용자 조건 (선택사항)
   *                     imageData:
   *                       type: object
   *                       description: 이미지 분석 결과 (선택사항)
   *                     winningNumbers:
   *                       type: object
   *                       nullable: true
   *                       description: 해당 회차의 당첨번호 정보
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
   *     summary: 추천 목록 조회 (통합 API)
   *     description: 파라미터로 다양한 조회 조건을 지원하는 통합 API
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
   *       - in: query
   *         name: winStatus
   *         schema:
   *           type: string
   *           enum: [WIN, LOSE, PENDING]
   *         description: "당첨상태 필터 (WIN: 당첨, LOSE: 미당첨, PENDING: 미추첨)"
   *       - in: query
   *         name: round
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 9999
   *         description: 특정 회차 조회 (지정 시 페이지네이션 무시)
   *       - in: query
   *         name: recent
   *         schema:
   *           type: boolean
   *           default: false
   *         description: 최근 추천 조회 (true 시 페이지네이션 무시, 최대 50개)
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
   *                         description: 추천된 번호 세트들
   *                       conditions:
   *                         type: object
   *                         description: 사용자 조건
   *                       imageData:
   *                         type: object
   *                         description: 이미지 분석 결과
   *                       winningNumbers:
   *                         type: object
   *                         nullable: true
   *                         description: 해당 회차의 당첨번호 정보
   *                         properties:
   *                           id:
   *                             type: string
   *                             example: "win_abc123"
   *                           round:
   *                             type: integer
   *                             example: 1150
   *                           numbers:
   *                             type: array
   *                             items:
   *                               type: integer
   *                             example: [1, 7, 14, 21, 28, 35]
   *                             description: 당첨번호
   *                           bonusNumber:
   *                             type: integer
   *                             example: 42
   *                             description: 보너스 번호
   *                           firstWinningAmount:
   *                             type: string
   *                             example: "2000000000"
   *                             description: 1등 당첨금
   *                           drawDate:
   *                             type: string
   *                             format: date-time
   *                             example: "2025-06-21T00:00:00.000Z"
   *                             description: 추첨일
   *                       winStatus:
   *                         type: string
   *                         enum: [WIN, LOSE, PENDING]
   *                         example: "WIN"
   *                         description: "당첨상태 (WIN: 당첨, LOSE: 미당첨, PENDING: 미추첨)"
   *                       matchCounts:
   *                         type: array
   *                         items:
   *                           type: integer
   *                         example: [3, 1, 2, 0, 1]
   *                         description: "각 세트별 맞은 번호 개수"
   *                       maxMatchCount:
   *                         type: integer
   *                         example: 3
   *                         description: "최대 맞은 번호 개수"
   *                       bestRank:
   *                         type: integer
   *                         nullable: true
   *                         example: 5
   *                         description: "최고 등수 (1-5등, null: 미당첨)"
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 message:
   *                   type: string
   *                   example: "추천 목록 조회가 완료되었습니다."
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
   *                       minItems: 6
   *                       maxItems: 6
   *                       example: [1, 7, 14, 21, 28, 35]
   *                       description: 당첨번호 (보너스번호 제외)
   *                     bonusNumber:
   *                       type: integer
   *                       example: 21
   *                       description: 보너스 추첨번호
   *                     firstWinningAmount:
   *                       type: integer
   *                       example: 4576672000
   *                       description: 1등 당첨금(원)
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
   *                       minItems: 6
   *                       maxItems: 6
   *                       example: [1, 7, 14, 21, 28, 35]
   *                       description: 당첨번호 (보너스번호 제외)
   *                     bonusNumber:
   *                       type: integer
   *                       example: 21
   *                       description: 보너스 추첨번호
   *                     firstWinningAmount:
   *                       type: integer
   *                       example: 4576672000
   *                       description: 1등 당첨금(원)
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
   *     summary: 최근 당첨번호 목록 조회 (페이징)
   *     description: 최근 당첨번호들을 페이징으로 조회
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
   *           maximum: 50
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
   *                         example: "win_abc123"
   *                       round:
   *                         type: integer
   *                         example: 1150
   *                       numbers:
   *                         type: array
   *                         items:
   *                           type: integer
   *                         example: [1, 7, 14, 21, 28, 35]
   *                         description: 당첨번호 (보너스번호 제외)
   *                       bonusNumber:
   *                         type: integer
   *                         example: 21
   *                         description: 보너스 추첨번호
   *                       firstWinningAmount:
   *                         type: integer
   *                         example: 4576672000
   *                         description: 1등 당첨금(원)
   *                       drawDate:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-06-21T20:00:00.000Z"
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-06-21T20:30:00.000Z"
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                       example: 1
   *                       description: 현재 페이지
   *                     limit:
   *                       type: integer
   *                       example: 10
   *                       description: 페이지 크기
   *                     total:
   *                       type: integer
   *                       example: 1177
   *                       description: 전체 데이터 수
   *                     totalPages:
   *                       type: integer
   *                       example: 118
   *                       description: 전체 페이지 수
   *                 message:
   *                   type: string
   *                   example: "최근 10개의 당첨번호입니다."
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

  /**
   * @swagger
   * /api/data/batch/fetch-latest-lotto:
   *   post:
   *     summary: 로또 최신번호 수동 조회 (배치)
   *     description: 수동으로 최신 회차의 로또 당첨번호를 조회하여 DB에 저장합니다.
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
   *                 message:
   *                   type: string
   *                   example: "로또 최신번호 조회가 완료되었습니다."
   *                 data:
   *                   type: object
   *                   properties:
   *                     round:
   *                       type: integer
   *                       example: 1178
   *                       description: 조회된 회차
   *                     numbers:
   *                       type: array
   *                       items:
   *                         type: integer
   *                       example: [5, 6, 11, 27, 43, 44]
   *                       description: 당첨번호
   *                     bonusNumber:
   *                       type: integer
   *                       example: 17
   *                       description: 보너스 번호
   *                     firstWinningAmount:
   *                       type: string
   *                       example: "2391608407"
   *                       description: 1등 당첨금
   *                     drawDate:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-06-28T00:00:00.000Z"
   *                       description: 추첨일
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: 조회 실패
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
   *                   example: "아직 당첨번호가 발표되지 않았습니다."
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
   *                   example: "데이터 조회 요청 한도를 초과했습니다."
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  router.post('/batch/fetch-latest-lotto', dataQueryLimiter, async (req, res) => {
    try {
      const lottoScheduler = new LottoScheduler();
      await lottoScheduler.manualFetch();
      
      const response: ApiResponse = {
        success: true,
        message: '로또 최신번호 조회가 완료되었습니다.',
        timestamp: new Date().toISOString(),
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        timestamp: new Date().toISOString(),
      };
      
      res.status(400).json(response);
    }
  });

  return router;
}; 
