import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticateAccess, requireAdmin } from '../middlewares/auth';

const router = Router();
const adminController = new AdminController();

// 모든 관리자 라우트에 인증 및 관리자 권한 체크 적용
router.use(authenticateAccess);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: 전체 사용자 목록 조회 (관리자 전용)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 사용자 목록 조회 성공
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nickname:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [USER, ADMIN]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           authType:
 *                             type: string
 *                             enum: [KAKAO, GOOGLE, NAVER]
 *                           hasActiveSubscription:
 *                             type: boolean
 *                           subscriptionEndDate:
 *                             type: string
 *                             format: date-time
 *                           recommendationCount:
 *                             type: integer
 *                           paymentCount:
 *                             type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 관리자 권한 없음
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: 사용자 역할 변경 (관리자 전용)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 description: 변경할 역할
 *     responses:
 *       200:
 *         description: 역할 변경 성공
 *       400:
 *         description: 유효하지 않은 역할
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 관리자 권한 없음
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.put('/users/:userId/role', adminController.updateUserRole);

/**
 * @swagger
 * /api/admin/stats/api:
 *   get:
 *     summary: API 사용 통계 조회 (관리자 전용)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜 (기본값: 30일 전)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜 (기본값: 오늘)
 *     responses:
 *       200:
 *         description: API 통계 조회 성공
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
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalRequests:
 *                           type: integer
 *                         successCount:
 *                           type: integer
 *                         failureCount:
 *                           type: integer
 *                         successRate:
 *                           type: string
 *                         totalCost:
 *                           type: number
 *                     endpointStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           endpoint:
 *                             type: string
 *                           requestCount:
 *                             type: integer
 *                           totalTokens:
 *                             type: integer
 *                           totalCost:
 *                             type: number
 *                     modelStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           model:
 *                             type: string
 *                           requestCount:
 *                             type: integer
 *                           totalTokens:
 *                             type: integer
 *                           totalCost:
 *                             type: number
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 관리자 권한 없음
 */
router.get('/stats/api', adminController.getApiStats);

/**
 * @swagger
 * /api/admin/status:
 *   get:
 *     summary: 시스템 상태 조회 (관리자 전용)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 시스템 상태 조회 성공
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
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         activeSubscriptions:
 *                           type: integer
 *                     recommendations:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         today:
 *                           type: integer
 *                     payments:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         completionRate:
 *                           type: string
 *                     system:
 *                       type: object
 *                       properties:
 *                         databaseSize:
 *                           type: string
 *                         uptime:
 *                           type: number
 *                         memoryUsage:
 *                           type: object
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 관리자 권한 없음
 */
router.get('/status', adminController.getSystemStatus);

export default router; 