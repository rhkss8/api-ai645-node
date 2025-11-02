/**
 * 포포춘 운세 라우트
 */
import { Router } from 'express';
import { FortuneController } from '../controllers/FortuneController';
import { authenticateAccess } from '../middlewares/auth';

export const createFortuneRoutes = (
  controller: FortuneController,
): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/fortune/session:
   *   post:
   *     operationId: createFortuneSession
   *     summary: 운세 세션 생성
   *     description: 채팅형 또는 문서형 운세 세션을 생성합니다. 문서형은 결제 필수, 채팅형은 결제 또는 무료 홍시 선택 가능.
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - category
   *               - mode
   *               - userInput
   *             properties:
   *               category:
   *                 type: string
   *                 enum: [SASA, TAROT, DREAM, LUCKY_NUMBER, LOVE, CAREER, BUSINESS, LUCKY_DAY, MOVING, CAR_PURCHASE, NAMING, NICKNAME]
   *                 description: 운세 카테고리
   *                 example: SASA
   *               mode:
   *                 type: string
   *                 enum: [CHAT, DOCUMENT]
   *                 description: 세션 모드 (CHAT=채팅형, DOCUMENT=문서형)
   *                 example: CHAT
   *               userInput:
   *                 type: string
   *                 description: 사용자 질문 또는 정보
   *                 example: "1990년 1월 1일 오전 10시에 태어났어요"
   *               paymentId:
   *                 type: string
   *                 description: 결제 ID (문서형 필수, 채팅형 선택)
   *                 example: "clx1234567890"
   *               useFreeHongsi:
   *                 type: boolean
   *                 description: 무료 홍시 사용 여부 (채팅형만, 하루 1회, 2분 무료). paymentId와 동시 사용 불가
   *                 example: true
   *               durationMinutes:
   *                 type: number
   *                 enum: [5, 10, 30]
   *                 description: 채팅형 결제 시 시간 선택 (5, 10, 30분). paymentId 있을 때만 필수. useFreeHongsi 사용 시에는 무시됨 (자동으로 2분 고정)
   *                 example: 10
   *     responses:
   *       201:
   *         description: 세션 생성 성공
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
   *                     sessionId:
   *                       type: string
   *                     category:
   *                       type: string
   *                     mode:
   *                       type: string
   *                     remainingTime:
   *                       type: number
   *                       description: 남은 시간 (초)
   *                     isActive:
   *                       type: boolean
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                     isPaid:
   *                       type: boolean
   *                 remainingTime:
   *                   type: number
   *                 isFreeHongsi:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: 잘못된 요청 (필수 필드 누락 등)
   *       401:
   *         description: 인증 필요
   */
  router.post(
    '/session',
    authenticateAccess,
    controller.createSession,
  );

  /**
   * @swagger
   * /api/fortune/chat:
   *   post:
   *     operationId: sendChatMessage
   *     summary: 채팅형 운세 메시지 전송
   *     description: 활성 세션에서 AI 운세 상담 메시지를 전송하고 응답을 받습니다.
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - sessionId
   *               - message
   *             properties:
   *               sessionId:
   *                 type: string
   *                 description: 세션 ID
   *                 example: "session_clx1234567890"
   *               message:
   *                 type: string
   *                 description: 사용자 메시지
   *                 example: "연애운이 어떤가요?"
   *     responses:
   *       200:
   *         description: 응답 생성 성공
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
   *                     summary:
   *                       type: string
   *                       description: 핵심 요약
   *                     points:
   *                       type: array
   *                       items:
   *                         type: string
   *                       description: 운세/조언 포인트
   *                     tips:
   *                       type: array
   *                       items:
   *                         type: string
   *                       description: 실천 팁
   *                     disclaimer:
   *                       type: string
   *                       description: 면책 문구
   *                     suggestPayment:
   *                       type: boolean
   *                       description: 결제 연장 제안 여부
   *                 remainingTime:
   *                   type: number
   *                   description: 남은 시간 (초)
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   *       400:
   *         description: 세션 없음 또는 시간 부족
   */
  router.post(
    '/chat',
    authenticateAccess,
    controller.sendChatMessage,
  );

  /**
   * @swagger
   * /api/fortune/document:
   *   post:
   *     operationId: createDocumentReport
   *     summary: 문서형 운세 리포트 생성
   *     description: 결제 완료된 문서형 세션에서 운세 리포트를 생성합니다. (결제 필수)
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - category
   *               - userInput
   *             properties:
   *               category:
   *                 type: string
   *                 enum: [SASA, TAROT, DREAM, LUCKY_NUMBER, LOVE, CAREER, BUSINESS, LUCKY_DAY, MOVING, CAR_PURCHASE, NAMING, NICKNAME]
   *                 description: 운세 카테고리
   *                 example: SASA
   *               userInput:
   *                 type: string
   *                 description: 사용자 정보 또는 질문
   *                 example: "1990년 1월 1일 오전 10시에 태어났어요"
   *     responses:
   *       201:
   *         description: 리포트 생성 성공
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
   *                     title:
   *                       type: string
   *                     date:
   *                       type: string
   *                     summary:
   *                       type: string
   *                     content:
   *                       type: string
   *                     advice:
   *                       type: array
   *                       items:
   *                         type: string
   *                     warnings:
   *                       type: array
   *                       items:
   *                         type: string
   *                     chatPrompt:
   *                       type: string
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   *       400:
   *         description: 결제 필요 또는 잘못된 요청
   */
  router.post(
    '/document',
    authenticateAccess,
    controller.createDocument,
  );

  /**
   * @swagger
   * /api/fortune/session/{id}:
   *   get:
   *     operationId: getFortuneSession
   *     summary: 운세 세션 조회
   *     description: 특정 운세 세션의 정보를 조회합니다.
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 세션 ID
   *     responses:
   *       200:
   *         description: 세션 조회 성공
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 세션을 찾을 수 없음
   */
  router.get(
    '/session/:id',
    authenticateAccess,
    controller.getSession,
  );

  /**
   * @swagger
   * /api/fortune/document/{id}:
   *   get:
   *     operationId: getDocumentReport
   *     summary: 문서 리포트 조회
   *     description: 생성된 문서형 운세 리포트를 조회합니다.
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 문서 ID
   *     responses:
   *       200:
   *         description: 문서 조회 성공
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 문서를 찾을 수 없음
   */
  router.get(
    '/document/:id',
    authenticateAccess,
    controller.getDocument,
  );

  /**
   * @swagger
   * /api/fortune/hongsi/purchase:
   *   post:
   *     operationId: purchaseHongsi
   *     summary: 홍시 구매
   *     description: 시간 단위 홍시를 구매합니다. (5분/10분/30분)
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - unit
   *             properties:
   *               unit:
   *                 type: string
   *                 enum: [MINUTES_5, MINUTES_10, MINUTES_30]
   *                 description: 홍시 단위
   *                 example: MINUTES_10
   *               sessionId:
   *                 type: string
   *                 description: 활성 세션 ID (선택, 있으면 자동 연장)
   *     responses:
   *       200:
   *         description: 홍시 구매 성공
   *       401:
   *         description: 인증 필요
   */
  router.post(
    '/hongsi/purchase',
    authenticateAccess,
    controller.purchaseHongsi,
  );

  /**
   * @swagger
   * /api/fortune/session/{id}/extend:
   *   post:
   *     operationId: extendSessionTime
   *     summary: 세션 시간 연장
   *     description: 활성 세션의 시간을 수동으로 연장합니다.
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 세션 ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - additionalSeconds
   *             properties:
   *               additionalSeconds:
   *                 type: number
   *                 description: 추가할 시간 (초)
   *                 example: 300
   *     responses:
   *       200:
   *         description: 시간 연장 성공
   *       401:
   *         description: 인증 필요
   */
  router.post(
    '/session/:id/extend',
    authenticateAccess,
    controller.extendSessionTime,
  );

  /**
   * @swagger
   * /api/fortune/statistics:
   *   get:
   *     operationId: getFortuneStatistics
   *     summary: 운세 통계 조회
   *     description: 사용자의 운세 서비스 사용 통계를 조회합니다.
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 통계 조회 성공
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
   *                     totalSessions:
   *                       type: number
   *                     activeSessions:
   *                       type: number
   *                     totalDocuments:
   *                       type: number
   *                     totalChats:
   *                       type: number
   *                     categoryUsage:
   *                       type: object
   *                     popularCategories:
   *                       type: array
   *       401:
   *         description: 인증 필요
   */
  router.get(
    '/statistics',
    authenticateAccess,
    controller.getStatistics,
  );

  /**
   * @swagger
   * /api/fortune/payment/prepare:
   *   post:
   *     operationId: prepareFortunePayment
   *     summary: 운세 결제 준비
   *     description: 운세 상품 결제를 위한 주문을 생성하고 결제 정보를 반환합니다.
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - productType
   *               - category
   *             properties:
   *               productType:
   *                 type: string
   *                 enum: [CHAT_SESSION, DOCUMENT_REPORT]
   *                 description: 상품 타입
   *                 example: CHAT_SESSION
   *               category:
   *                 type: string
   *                 enum: [SASA, TAROT, DREAM, LUCKY_NUMBER, LOVE, CAREER, BUSINESS, LUCKY_DAY, MOVING, CAR_PURCHASE, NAMING, NICKNAME]
   *                 description: 운세 카테고리
   *                 example: SASA
   *               durationMinutes:
   *                 type: number
   *                 enum: [5, 10, 30]
   *                 description: 채팅형일 경우 시간 선택 (5, 10, 30분, 필수)
   *                 example: 10
   *     responses:
   *       200:
   *         description: 결제 준비 성공
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
   *                     orderId:
   *                       type: string
   *                     paymentId:
   *                       type: string
   *                     amount:
   *                       type: number
   *                     productName:
   *                       type: string
   *                     merchantUid:
   *                       type: string
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   *       400:
   *         description: 잘못된 요청
   */
  router.post(
    '/payment/prepare',
    authenticateAccess,
    controller.preparePayment,
  );

  /**
   * @swagger
   * /api/fortune/products/{category}:
   *   get:
   *     operationId: getProductsByCategory
   *     summary: 카테고리별 상품 정보 조회
   *     description: 특정 카테고리의 채팅형/문서형 상품 정보를 조회합니다. (인증 불필요)
   *     tags: [Fortune]
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *           enum: [SASA, TAROT, DREAM, LUCKY_NUMBER, LOVE, CAREER, BUSINESS, LUCKY_DAY, MOVING, CAR_PURCHASE, NAMING, NICKNAME]
   *         description: 운세 카테고리
   *     responses:
   *       200:
   *         description: 상품 정보 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       type:
   *                         type: string
   *                         enum: [CHAT_SESSION, DOCUMENT_REPORT]
   *                       category:
   *                         type: string
   *                       productId:
   *                         type: string
   *                         description: 상품 고유 ID
   *                       name:
   *                         type: string
   *                       amount:
   *                         type: number
   *                         description: 원래 가격 (할인 전, 원)
   *                       discountRate:
   *                         type: number
   *                         description: 할인률 (0~100, 예: 10 = 10% 할인)
   *                       finalAmount:
   *                         type: number
   *                         description: 실제 결제 금액 (할인 적용 후, 원)
   *                       description:
   *                         type: string
   *                       duration:
   *                         type: number
   *                         description: 세션 시간 (초, 채팅형만)
   *       400:
   *         description: 잘못된 카테고리
   */
  router.get(
    '/products/:category',
    controller.getProducts,
  );

  /**
   * @swagger
   * /api/fortune/products:
   *   get:
   *     operationId: getAllProducts
   *     summary: 전체 상품 정보 조회
   *     description: 모든 카테고리의 상품 정보를 조회합니다. (인증 불필요)
   *     tags: [Fortune]
   *     responses:
   *       200:
   *         description: 전체 상품 정보 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   additionalProperties:
   *                     type: array
   *                     items:
   *                       type: object
   */
  router.get(
    '/products',
    controller.getAllProducts,
  );

  return router;
};
