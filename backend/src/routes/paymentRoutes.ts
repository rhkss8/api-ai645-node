import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticateAccess } from '../middlewares/auth';

export const createPaymentRoutes = (controller: PaymentController): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/payment/order-register:
   *   post:
   *     operationId: createOrder
   *     summary: 주문 생성
   *     description: 결제를 위한 주문을 생성합니다. 유료 추천의 경우 paramId를 포함해야 합니다.
   *     tags: [Payment]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *             properties:
   *               amount:
   *                 type: integer
   *                 description: 결제 금액
   *                 example: 10000
   *               paramId:
   *                 type: string
   *                 description: 추천 파라미터 ID (유료 추천의 경우 필수)
   *                 example: "param_abc123"
   *               currency:
   *                 type: string
   *                 description: 통화 코드
   *                 default: "KRW"
   *               description:
   *                 type: string
   *                 description: 주문 설명
   *               metadata:
   *                 type: object
   *                 description: 추가 메타데이터
   *     responses:
   *       201:
   *         description: 주문 생성 성공
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
   *                     order:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           description: 주문 ID
   *                           example: "ord_abc123def456"
   *                         merchantUid:
   *                           type: string
   *                           description: 가맹점 주문 ID
   *                           example: "merchant_20250801_123456"
   *                         amount:
   *                           type: integer
   *                           description: 결제 금액
   *                           example: 10000
   *                         currency:
   *                           type: string
   *                           description: 통화 코드
   *                           example: "KRW"
   *                         description:
   *                           type: string
   *                           description: 주문 설명
   *                           example: "프리미엄 로또 추천"
   *                         status:
   *                           type: string
   *                           description: 주문 상태
   *                           example: "PENDING"
   *                         orderName:
   *                           type: string
   *                           description: 주문명
   *                           example: "로또 추천 서비스"
   *                         userId:
   *                           type: string
   *                           description: 사용자 ID
   *                         paramId:
   *                           type: string
   *                           description: 추천 파라미터 ID (있는 경우)
   *                           nullable: true
   *                         recommendationId:
   *                           type: string
   *                           description: 추천 결과 ID (있는 경우)
   *                           nullable: true
   *                         createdAt:
   *                           type: string
   *                           format: date-time
   *                           description: 생성 시간
   *                         user:
   *                           type: object
   *                           properties:
   *                             id:
   *                               type: string
   *                             nickname:
   *                               type: string
   *                 message:
   *                   type: string
   *                   example: "주문이 생성되었습니다."
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
   *                   example: "유효하지 않은 결제 금액입니다."
   *                 message:
   *                   type: string
   *                   example: "결제 금액을 확인해주세요."
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
   *                   example: "다시 로그인해주세요."
   */
  router.post('/order-register', authenticateAccess, controller.createOrder);

  /**
   * @swagger
   * /api/payment/complete:
   *   post:
   *     operationId: verifyPayment
   *     summary: 결제 완료 처리 (V2)
   *     description: PortOne V2 결제를 검증하고 처리합니다.
   *     tags: [Payment]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - paymentId
   *             properties:
   *               paymentId:
   *                 type: string
   *                 description: PortOne V2 결제 ID
   *                 example: "payment_1234567890"
   *     responses:
   *       200:
   *         description: 결제 검증 성공
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
   *                     payment:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         paymentId:
   *                           type: string
   *                         amount:
   *                           type: integer
   *                         status:
   *                           type: string
   *                           enum: [PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED]
   *                         paidAt:
   *                           type: string
   *                           format: date-time
   *                 message:
   *                   type: string
   *                   example: "결제가 성공적으로 처리되었습니다."
   *       400:
   *         description: 결제 검증 실패
   */
  router.post('/complete', controller.verifyPayment);

  /**
   * @swagger
   * /api/payment/webhooks/iamport:
   *   post:
   *     operationId: handlePortOneWebhook
   *     summary: PortOne Webhook 처리
   *     description: PortOne에서 전송하는 결제 상태 변경 webhook을 처리합니다.
   *     tags: [Payment]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               imp_uid:
   *                 type: string
   *                 description: PortOne 결제 고유번호
   *               merchant_uid:
   *                 type: string
   *                 description: 주문 고유번호
   *               status:
   *                 type: string
   *                 description: 결제 상태
   *                 enum: [paid, failed, cancelled]
   *     responses:
   *       200:
   *         description: Webhook 처리 성공
   *       403:
   *         description: 허용되지 않은 IP
   *       400:
   *         description: 잘못된 요청
   */
  router.post('/webhooks/iamport', controller.handleWebhook);

  /**
   * @swagger
   * /api/payment/status:
   *   put:
   *     operationId: updatePaymentStatus
   *     summary: 결제 상태 변경
   *     description: 주문의 결제 상태를 변경합니다.
   *     tags: [Payment]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - orderId
   *               - status
   *             properties:
   *               orderId:
   *                 type: string
   *                 description: 주문 ID
   *                 example: "clx1234567890"
   *               status:
   *                 type: string
   *                 description: 변경할 상태
   *                 enum: [PENDING, PAID, FAILED, CANCELLED, USER_CANCELLED, REFUNDED]
   *                 example: "USER_CANCELLED"
   *               reason:
   *                 type: string
   *                 description: 상태 변경 사유 (선택사항)
   *                 example: "사용자 요청으로 취소"
   *     responses:
   *       200:
   *         description: 결제 상태 변경 성공
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
   *                     order:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         status:
   *                           type: string
   *                           enum: [PENDING, PAID, FAILED, CANCELLED, USER_CANCELLED, REFUNDED]
   *                         updatedAt:
   *                           type: string
   *                           format: date-time
   *                     payment:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         status:
   *                           type: string
   *                           enum: [PENDING, COMPLETED, FAILED, CANCELLED, USER_CANCELLED, REFUNDED]
   *                         updatedAt:
   *                           type: string
   *                           format: date-time
   *                 message:
   *                   type: string
   *                   example: "결제 상태가 변경되었습니다."
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증 필요
   *       403:
   *         description: 권한 없음
   */
  router.put('/status', authenticateAccess, controller.updatePaymentStatus);

  /**
   * @swagger
   * /api/payment/orders/{id}:
   *   get:
   *     operationId: getOrder
   *     summary: 주문 조회
   *     description: 특정 주문의 상세 정보를 조회합니다.
   *     tags: [Payment]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 주문 ID
   *     responses:
   *       200:
   *         description: 주문 조회 성공
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
   *                     order:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         merchantUid:
   *                           type: string
   *                         amount:
   *                           type: integer
   *                         status:
   *                           type: string
   *                         payment:
   *                           type: object
   *                           nullable: true
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 주문을 찾을 수 없음
   */
  router.get('/orders/:id', authenticateAccess, controller.getOrder);

  /**
   * @swagger
   * /api/payment/orders:
   *   get:
   *     operationId: getUserOrders
   *     summary: 사용자 주문 목록 조회
   *     description: 현재 로그인한 사용자의 주문 목록을 조회합니다.
   *     tags: [Payment]
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
   *         description: 주문 목록 조회 성공
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
   *                     orders:
   *                       type: array
   *                       items:
   *                         type: object
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
   *       401:
   *         description: 인증 필요
   */
  router.get('/orders', authenticateAccess, controller.getUserOrders);

  return router;
}; 