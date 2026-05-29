/**
 * 포포춘 운세 라우트
 */
import { Router } from 'express';
import multer from 'multer';
import { FortuneController } from '../controllers/FortuneController';
import { authenticateAccess } from '../middlewares/auth';

export const createFortuneRoutes = (
  controller: FortuneController,
): Router => {
  const router = Router();
  const chatImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('이미지 파일만 업로드할 수 있습니다.'));
        return;
      }
      cb(null, true);
    },
  });

  /**
   * @swagger
   * /api/v1/fortune/session:
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
   *               - formType
   *               - mode
   *               - userInput
   *             properties:
   *               category:
   *                 type: string
   *                 enum: [SAJU, NEW_YEAR, MONEY, HAND, TOJEONG, BREAK_UP, CAR_PURCHASE, BUSINESS, INVESTMENT, LOVE, DREAM, LUCKY_NUMBER, MOVING, TRAVEL, COMPATIBILITY, TAROT, CAREER, LUCKY_DAY, NAMING, DAILY]
   *                 description: 운세 카테고리
   *                 example: SAJU
   *               formType:
   *                 type: string
   *                 enum: [ASK, DAILY, TRADITIONAL]
   *                 description: 폼 타입 (ASK=자유질문, DAILY=오늘의 운세, TRADITIONAL=전통 운세)
   *                 example: ASK
   *               mode:
   *                 type: string
   *                 enum: [CHAT, DOCUMENT]
   *                 description: 세션 모드 (CHAT=채팅형, DOCUMENT=문서형)
   *                 example: CHAT
   *               userInput:
   *                 type: string
   *                 description: 사용자 질문 또는 정보
   *                 example: "1990년 1월 1일 오전 10시에 태어났어요"
   *               userData:
   *                 type: object
   *                 description: 구조화된 운세 데이터 (선택사항, 이름, 생년월일, 성별 등)
   *                 example:
   *                   name: "홍길동"
   *                   birthDate: "1990-05-14"
   *                   birthTime: "10:00"
   *                   gender: "male"
   *                   solarLunar: "solar"
   *                 properties:
   *                   name:
   *                     type: string
   *                     description: 이름
   *                   birthDate:
   *                     type: string
   *                     format: date
   *                     description: 생년월일 (YYYY-MM-DD)
   *                   birthTime:
   *                     type: string
   *                     description: 생시 (HH:mm)
   *                   gender:
   *                     type: string
   *                     enum: [male, female]
   *                     description: 성별
   *                   solarLunar:
   *                     type: string
   *                     enum: [solar, lunar]
   *                     description: 양력/음력
   *               paymentId:
   *                 type: string
   *                 description: 결제 ID (문서형 필수, 채팅형 선택)
   *                 example: "clx1234567890"
   *               portOnePaymentId:
   *                 type: string
   *                 description: PortOne 실제 결제 ID
   *                 example: "payment_1234567890"
   *               payMethod:
   *                 type: string
   *                 description: 실제 결제 수단
   *                 example: "CARD"
   *               easyPayProvider:
   *                 type: string
   *                 description: 간편결제 제공자
   *                 example: "KAKAOPAY"
   *               chatEntitlementDays:
   *                 type: integer
   *                 enum: [1, 7, 30]
   *                 description: 채팅형 유료 세션 이용권 일수
   *               useFreeHongsi:
   *                 type: boolean
   *                 description: 무료 홍시 사용 여부 (채팅형만, 하루 1회, 5분 무료). paymentId와 동시 사용 불가
   *                 example: true
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
   *                     formType:
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
   *                     chatEntitlementExpiresAt:
   *                       type: string
   *                       format: date-time
   *                       description: 채팅 일 단위 이용권 만료 시각(해당 결제인 경우만)
   *                     isPaid:
   *                       type: boolean
   *                     resultToken:
   *                       type: string
   *                       description: 결과 페이지 접근용 JWT 토큰
   *                 remainingTime:
   *                   type: number
   *                 isFreeHongsi:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: |
   *           잘못된 요청. 채팅형에서 계정 이용 시간이 없으면 error=CHAT_ACCOUNT_TIME_EXHAUSTED,
   *           data.requiresPayment=true 및 suggestedPass(1일권 가격 등)가 포함될 수 있음.
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
   * /api/v1/fortune/chat/from-document:
   *   post:
   *     operationId: startChatFromDocument
   *     summary: 문서 결과 기반 채팅 시작
   *     description: 문서형 결과를 기반으로 채팅 상담을 시작합니다. 같은 카테고리의 활성 채팅 세션이 있으면 재사용하고, 없으면 새 채팅 세션을 생성합니다.
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
   *               - documentId
   *             properties:
   *               documentId:
   *                 type: string
   *                 description: 문서형 운세 결과 ID
   *                 example: "doc_XHvxNVpV"
   *               forceNewSession:
   *                 type: boolean
   *                 description: true면 기존 활성 채팅을 재사용하지 않고 새 채팅 세션을 생성합니다.
   *                 example: false
   *     responses:
   *       200:
   *         description: 문서 기반 채팅 진입 성공
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
   *                     sessionId:
   *                       type: string
   *                     category:
   *                       type: string
   *                     formType:
   *                       type: string
   *                     mode:
   *                       type: string
   *                     resultToken:
   *                       type: string
   *                     reusedSession:
   *                       type: boolean
   *                     sourceDocumentId:
   *                       type: string
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 문서를 찾을 수 없음
   */
  router.post(
    '/chat/from-document',
    authenticateAccess,
    controller.startChatFromDocument,
  );

  /**
   * @swagger
   * /api/v1/fortune/chat:
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
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               sessionId:
   *                 type: string
   *                 description: 세션 ID
   *                 example: "session_clx1234567890"
   *               message:
   *                 type: string
   *                 description: 사용자 메시지. 손금 이미지만 보내는 경우 생략 가능
   *                 example: "손금 사진을 보고 연애운을 알려주세요."
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: 손금 상담용 이미지 파일 (저장하지 않고 메모리에서만 처리)
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
   *                     message:
   *                       type: string
   *                       description: 점술가가 말하듯 자연스럽게 이어지는 답변 텍스트
   *                     nextQuestions:
   *                       type: array
   *                       items:
   *                         type: string
   *                       description: 다음 단계로 이어지는 추천 질문(퀵 리플라이)
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
   *                   example: "AUTH_REQUIRED"
   *                 message:
   *                   type: string
   *                   example: "로그인이 필요합니다."
   *       400:
   *         description: 세션 없음, 시간 만료, 또는 잘못된 요청
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
   *                   enum:
   *                     - SESSION_TIME_EXPIRED
   *                     - SESSION_EXPIRED
   *                     - SESSION_NOT_FOUND
   *                     - INVALID_REQUEST
   *                   example: "SESSION_TIME_EXPIRED"
   *                 message:
   *                   type: string
   *                   example: "세션 시간이 만료되었습니다. 상담권을 구매하여 상담을 계속하세요."
   *                 data:
   *                   type: object
   *                   properties:
   *                     requiresPayment:
   *                       type: boolean
   *                       description: 결제 유도 필요 여부
   *                       example: true
   *                     remainingTime:
   *                       type: number
   *                       description: 남은 시간 (초)
   *                       example: 0
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                       description: 만료 시간
   *       404:
   *         description: 세션을 찾을 수 없음
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
   *                   example: "SESSION_NOT_FOUND"
   *                 message:
   *                   type: string
   *                   example: "세션을 찾을 수 없습니다."
   *       429:
   *         description: AI 서비스 할당량 초과
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
   *                   example: "AI_QUOTA_EXCEEDED"
   *                 message:
   *                   type: string
   *                   example: "AI 서비스 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요."
   *                 data:
   *                   type: object
   *                   properties:
   *                     requiresPayment:
   *                       type: boolean
   *                       example: false
   *                     retryAfter:
   *                       type: number
   *                       description: 재시도 권장 시간 (초)
   *                       example: 60
   *       500:
   *         description: AI 응답 생성 실패 또는 서버 오류
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
   *                   enum:
   *                     - AI_GENERATION_FAILED
   *                     - INTERNAL_ERROR
   *                   example: "AI_GENERATION_FAILED"
   *                 message:
   *                   type: string
   *                   example: "운세 응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요."
   *                 data:
   *                   type: object
   *                   properties:
   *                     requiresPayment:
   *                       type: boolean
   *                       example: false
   */
  router.post(
    '/chat',
    authenticateAccess,
    chatImageUpload.single('image'),
    controller.sendChatMessage,
  );

  /**
   * @swagger
   * /api/v1/fortune/document:
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
   *               - formType
   *               - userInput
   *             properties:
   *               category:
   *                 type: string
   *                 enum: [SAJU, NEW_YEAR, MONEY, HAND, TOJEONG, BREAK_UP, CAR_PURCHASE, BUSINESS, INVESTMENT, LOVE, DREAM, LUCKY_NUMBER, MOVING, TRAVEL, COMPATIBILITY, TAROT, CAREER, LUCKY_DAY, NAMING, DAILY]
   *                 description: 운세 카테고리
   *                 example: SAJU
   *               formType:
   *                 type: string
   *                 enum: [ASK, DAILY, TRADITIONAL]
   *                 description: 폼 타입 (ASK=자유질문, DAILY=오늘의 운세, TRADITIONAL=전통 운세)
   *                 example: TRADITIONAL
   *               userInput:
   *                 type: string
   *                 description: 사용자 정보 또는 질문
   *                 example: "1990년 1월 1일 오전 10시에 태어났어요"
   *               userData:
   *                 type: object
   *                 description: 구조화된 운세 데이터 (선택사항, 이름, 생년월일, 성별 등)
   *                 example:
   *                   name: "홍길동"
   *                   birthDate: "1990-05-14"
   *                   birthTime: "10:00"
   *                   gender: "male"
   *                   solarLunar: "solar"
   *                 properties:
   *                   name:
   *                     type: string
   *                     description: 이름
   *                   birthDate:
   *                     type: string
   *                     format: date
   *                     description: 생년월일 (YYYY-MM-DD)
   *                   birthTime:
   *                     type: string
   *                     description: 생시 (HH:mm)
   *                   gender:
   *                     type: string
   *                     enum: [male, female]
   *                     description: 성별
   *                   solarLunar:
   *                     type: string
   *                     enum: [solar, lunar]
   *                     description: 양력/음력
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
   *                     documentLink:
   *                       type: string
   *                       description: 생성된 문서 리포트의 직접 링크
   *                     resultToken:
   *                       type: string
   *                       description: 결과 페이지 접근용 JWT 토큰
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
   * /api/v1/fortune/session/{id}:
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
   * /api/v1/fortune/document/{id}:
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
   * /api/v1/fortune/payment/webhook:
   *   post:
   *     operationId: fortunePaymentWebhook
   *     summary: 결제 웹훅 (PortOne 서버→서버)
   *     description: 결제 완료 알림을 수신하고 결제 내역을 확정합니다.
   *     tags: [Fortune]
   *     security: []
   *     parameters:
   *       - in: header
   *         name: x-webhook-secret
   *         required: true
   *         schema:
   *           type: string
   *         description: PortOne 웹훅 시크릿 (백엔드 환경변수와 일치해야 함)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [orderId, paymentId, amount, status]
   *             properties:
   *               orderId:
   *                 type: string
   *                 description: 주문 ID
   *                 example: "order_1234567890"
   *               paymentId:
   *                 type: string
   *                 description: 결제 ID
   *                 example: "payment_1234567890"
   *               amount:
   *                 type: number
   *                 description: 결제 금액
   *                 example: 10000
   *               status:
   *                 type: string
   *                 enum: [PAID, FAILED, PENDING, CANCELLED, USER_CANCELLED, REFUNDED]
   *                 description: 결제 상태
   *                 example: PAID
   *               payMethod:
   *                 type: string
   *                 description: 결제 방법 (card, kakao, toss, naver 등, 선택, PortOne에서 자동 추출)
   *                 example: "kakao"
   *               easyPayProvider:
   *                 type: string
   *                 description: 간편결제 제공자 (kakaopay, tosspay, naverpay 등, 선택, PortOne에서 자동 추출)
   *                 example: "kakaopay"
   *     responses:
   *       200:
   *         description: 웹훅 처리 성공
   *       400:
   *         description: 잘못된 요청 (필수 파라미터 누락)
   *       401:
   *         description: 웹훅 시크릿 불일치
   *       500:
   *         description: 웹훅 처리 실패
   */
  router.post(
    '/payment/webhook',
    controller.paymentWebhook,
  );

  /**
   * @swagger
   * /api/v1/fortune/payment/{paymentId}/status:
   *   get:
   *     operationId: getPaymentStatus
   *     summary: 결제 상태 확인 (프론트엔드 폴링용)
   *     description: 결제 상태를 확인합니다. 프론트엔드에서 폴링하여 사용합니다.
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: paymentId
   *         required: true
   *         schema:
   *           type: string
   *         description: 결제 ID
   *     responses:
   *       200:
   *         description: 결제 상태 조회 성공
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
   *                     paymentId:
   *                       type: string
   *                     status:
   *                       type: string
   *                       enum: [PENDING, COMPLETED, FAILED, CANCELLED, USER_CANCELLED, REFUNDED]
   *                     amount:
   *                       type: number
   *                     paidAt:
   *                       type: string
   *                       format: date-time
   *                       nullable: true
   *       400:
   *         description: 결제 ID 누락
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 결제 정보를 찾을 수 없음
   *       403:
   *         description: 접근 권한 없음
   */
  router.get(
    '/payment/:paymentId/status',
    authenticateAccess,
    controller.getPaymentStatus,
  );

  /**
   * @swagger
   * /api/v1/fortune/result/{token}:
   *   get:
   *     operationId: getFortuneResultByToken
   *     summary: 운세 결과 조회 (토큰 기반)
   *     description: |
   *       결과 토큰을 사용하여 운세 세션 메타데이터, 문서, 최근 채팅, CTA 정보를 조회합니다.
   *       
   *       **중요**: 최근 문서형 세션은 백그라운드 문서 생성 중일 수 있으며, 이때는 `pending=true`, `documentStatus=PENDING`으로 응답할 수 있습니다.
   *       백그라운드 생성이 실패하면 `429` 또는 `500` 에러로 조기 전환됩니다.
   *       오래된 문서형 세션은 legacy 복구를 위해 조회 시점 fallback 생성이 동작할 수 있습니다.
   *     tags: [Fortune]
   *     security: []
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: 결과 페이지 접근용 JWT 토큰
   *     responses:
   *       200:
   *         description: 운세 결과 조회 성공
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
   *                     sessionMeta:
   *                       type: object
   *                       properties:
   *                         sessionId: { type: string }
   *                         category: { type: string }
   *                         formType: { type: string }
   *                         mode: { type: string }
   *                         remainingTime: { type: number }
   *                         chatUsableUntil: { type: string, format: date-time, nullable: true }
   *                         isPaid: { type: boolean }
   *                         expiresAt: { type: string, format: date-time }
   *                     document:
   *                       type: object
   *                       nullable: true
   *                       properties:
   *                         id: { type: string }
   *                         userId: { type: string }
   *                         category: { type: string }
   *                         title: { type: string }
   *                         content: { type: string }
   *                         issuedAt: { type: string, format: date-time }
   *                         expiresAt: { type: string, format: date-time }
   *                         documentLink: { type: string, nullable: true }
   *                     pending:
   *                       type: boolean
   *                       description: 문서형 세션 결과가 아직 준비 중인지 여부
   *                     documentStatus:
   *                       type: string
   *                       enum: [PENDING, COMPLETED, FAILED, UNAVAILABLE]
   *                       description: 문서 생성 상태
   *                     lastChats:
   *                       type: array
   *                       items:
   *                         type: object
   *                       description: 최근 5개 채팅 기록 (채팅형 세션일 경우)
   *                     cta:
   *                       type: object
   *                       properties:
   *                         label: { type: string }
   *                         requiresPayment: { type: boolean }
   *                 message:
   *                   type: string
   *       401:
   *         description: 토큰 유효성 검증 실패 (TOKEN_INVALID)
   *       404:
   *         description: 세션을 찾을 수 없음 (SESSION_EXPIRED)
   *       429:
   *         description: AI 서비스 할당량 초과 (AI_QUOTA_EXCEEDED)
   *       503:
   *         description: AI 서비스 일시 장애/과부하 (AI_SERVICE_UNAVAILABLE)
   *       500:
   *         description: 서버 오류
   */
  router.get(
    '/result/:token',
    controller.getResultByToken,
  );

  /**
   * @swagger
   * /api/v1/fortune/hongsi/purchase:
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
   * /api/v1/fortune/sessions/{id}/extend:
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
    '/sessions/:id/extend',
    authenticateAccess,
    controller.extendSessionTime,
  );

  /**
   * @swagger
   * /api/v1/fortune/statistics:
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
   *                       items:
   *                         type: string
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
   * /api/v1/fortune/payment/prepare:
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
   *             properties:
   *               productType:
   *                 type: string
   *                 enum: [CHAT_SESSION, DOCUMENT_REPORT]
   *                 description: 상품 타입
   *                 example: CHAT_SESSION
   *               category:
   *                 type: string
   *                 enum: [SAJU, NEW_YEAR, MONEY, HAND, TOJEONG, BREAK_UP, CAR_PURCHASE, BUSINESS, INVESTMENT, LOVE, DREAM, LUCKY_NUMBER, MOVING, TRAVEL, COMPATIBILITY, TAROT, CAREER, LUCKY_DAY, NAMING, DAILY]
   *                 description: 운세 카테고리 (DOCUMENT_REPORT일 때 필수, CHAT_SESSION은 생략 가능)
   *                 example: SAJU
   *               payMethod:
   *                 type: string
   *                 description: 결제 방법 (card, kakao, toss, naver 등, 선택)
   *                 example: "card"
   *               easyPayProvider:
   *                 type: string
   *                 description: 간편결제 제공자 (kakaopay, tosspay, naverpay 등, 선택)
   *                 example: "kakaopay"
   *               chatEntitlementDays:
   *                 type: integer
   *                 enum: [1, 7, 30]
   *                 description: 채팅 이용권 일수 (CHAT_SESSION일 때 필수)
   *                 example: 7
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
   *                       description: 실제 결제 금액 (할인 적용 후)
   *                     productName:
   *                       type: string
   *                     merchantUid:
   *                       type: string
   *                       description: PortOne 결제 창 오픈에 사용할 주문 고유 ID
   *                       example: "FORTUNE172345678900ABCDEF"
   *                     buyerEmail:
   *                       type: string
   *                       nullable: true
   *                       description: 결제창 고객 정보에 사용할 이메일
   *                     buyerPhone:
   *                       type: string
   *                       nullable: true
   *                       description: 결제창 고객 정보에 사용할 연락처
   *                     hasExistingDocument:
   *                       type: boolean
   *                       description: 문서형 상품에서 유효한 기존 문서 존재 여부
   *                     existingDocumentId:
   *                       type: string
   *                       nullable: true
   *                       description: 기존 문서 ID
   *                     existingResultToken:
   *                       type: string
   *                       nullable: true
   *                       description: 기존 문서를 바로 열기 위한 결과 토큰
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
   * /api/v1/fortune/payment/{paymentId}/confirm:
   *   post:
   *     operationId: confirmFortunePayment
   *     summary: 운세 결제 확인
   *     description: PortOne 상태를 동기화하여 최신 결제 상태를 반환합니다. 독립 채팅 이용권 구매 완료 확인에 사용합니다.
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: paymentId
   *         required: true
   *         schema:
   *           type: string
   *         description: 결제 ID
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               portOnePaymentId:
   *                 type: string
   *                 description: PortOne 결제 ID (SDK 응답값)
   *     responses:
   *       200:
   *         description: 결제 상태 조회 성공
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
   *                     paymentId:
   *                       type: string
   *                     status:
   *                       type: string
   *                       enum: [PENDING, COMPLETED, FAILED, CANCELLED, USER_CANCELLED, REFUNDED]
   *                     amount:
   *                       type: number
   *                     paidAt:
   *                       type: string
   *                       format: date-time
   *                       nullable: true
   *       401:
   *         description: 인증 필요
   *       403:
   *         description: 본인 결제가 아님
   *       404:
   *         description: 결제 없음
   */
  router.post(
    '/payment/:paymentId/confirm',
    authenticateAccess,
    controller.confirmPayment,
  );

  /**
   * @swagger
   * /api/v1/fortune/products/{category}:
   *   get:
   *     operationId: getProductsByCategory
   *     summary: 카테고리별 상품 정보 조회
   *     description: |
   *       특정 카테고리의 채팅 이용권(1/7/30일) + 문서형 상품 정보를 조회합니다. (인증 불필요)
   *       - path `category`: 운세 카테고리 (예: SAJU)
   *       - response item `type`: 상품 타입 (CHAT_SESSION | DOCUMENT_REPORT)
   *     tags: [Fortune]
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *           enum: [SAJU, NEW_YEAR, MONEY, HAND, TOJEONG, BREAK_UP, CAR_PURCHASE, BUSINESS, INVESTMENT, LOVE, DREAM, LUCKY_NUMBER, MOVING, TRAVEL, COMPATIBILITY, TAROT, CAREER, LUCKY_DAY, NAMING, DAILY]
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
   *                         description: "할인률 (0~100, 예: 10 = 10% 할인)"
   *                       finalAmount:
   *                         type: number
   *                         description: 실제 결제 금액 (할인 적용 후, 원)
   *                       description:
   *                         type: string
   *                       entitlementDays:
   *                         type: number
   *                         enum: [1, 7, 30]
   *                         description: 채팅 이용권 일수 (채팅형 상품만)
   *       400:
   *         description: 잘못된 카테고리
   */
  router.get(
    '/products/:category',
    controller.getProducts,
  );

  /**
   * @swagger
   * /api/v1/fortune/products:
   *   get:
   *     operationId: getAllProducts
   *     summary: 전체 상품 정보 조회
   *     description: 모든 카테고리의 채팅 이용권(1/7/30일) + 문서형 상품 정보를 조회합니다. (인증 불필요)
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

  /**
   * @swagger
   * /api/v1/fortune/payment/{paymentId}/cancel:
   *   post:
   *     operationId: cancelFortunePayment
   *     summary: 운세 결제 취소
   *     description: 사용자가 완료된 결제를 취소합니다. 결제 상태와 주문 상태가 CANCELLED로 변경되고, 관련 세션이 비활성화됩니다.
   *     tags: [Fortune]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: paymentId
   *         required: true
   *         schema:
   *           type: string
   *         description: 취소할 결제 ID
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 description: 취소 사유 (선택)
   *     responses:
   *       200:
   *         description: 결제 취소 성공
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
   *                     paymentId:
   *                       type: string
   *                     orderId:
   *                       type: string
   *                 message:
   *                   type: string
   *       400:
   *         description: 잘못된 요청 (이미 취소됨, 취소 불가능한 상태 등)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   *       403:
   *         description: 접근 권한 없음 (본인의 결제가 아님)
   *       404:
   *         description: 결제 정보를 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  router.post(
    '/payment/:paymentId/cancel',
    authenticateAccess,
    controller.cancelPayment,
  );

  /**
   * @swagger
   * /api/v1/fortune/payments:
   *   get:
   *     operationId: getFortunePayments
   *     summary: 운세 결제 내역 조회
   *     description: 사용자의 운세 관련 결제 내역을 조회합니다. 페이지네이션 및 필터링을 지원합니다.
   *     tags: [Fortune]
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
   *           maximum: 100
   *         description: 페이지당 항목 수 (최대 100)
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, PAID, FAILED, CANCELLED, USER_CANCELLED, REFUNDED]
   *         description: 주문 상태 필터
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [SAJU, NEW_YEAR, MONEY, HAND, TOJEONG, BREAK_UP, CAR_PURCHASE, BUSINESS, INVESTMENT, LOVE, DREAM, LUCKY_NUMBER, MOVING, TRAVEL, COMPATIBILITY, TAROT, CAREER, LUCKY_DAY, NAMING, DAILY]
   *         description: 운세 카테고리 필터
   *       - in: query
   *         name: mode
   *         schema:
   *           type: string
   *           enum: [CHAT, DOCUMENT]
   *         description: 세션 모드 필터
   *     responses:
   *       200:
   *         description: 결제 내역 조회 성공
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
   *                     items:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           merchantUid:
   *                             type: string
   *                           orderName:
   *                             type: string
   *                           amount:
   *                             type: integer
   *                           status:
   *                             type: string
   *                           payment:
   *                             type: object
   *                           metadata:
   *                             type: object
   *                           session:
   *                             type: object
   *                           result:
   *                             type: object
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   */
  router.get(
    '/payments',
    authenticateAccess,
    controller.getPayments,
  );

  /**
   * @swagger
   * /api/v1/fortune/payments/{orderId}:
   *   get:
   *     operationId: getFortunePaymentDetail
   *     summary: 운세 결제 내역 상세 조회
   *     description: 특정 결제 내역의 상세 정보를 조회합니다.
   *     tags: [Fortune]
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
   *         description: 결제 내역 상세 조회 성공
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
   *                     id:
   *                       type: string
   *                     merchantUid:
   *                       type: string
   *                     orderName:
   *                       type: string
   *                     amount:
   *                       type: integer
   *                     status:
   *                       type: string
   *                       enum: [PENDING, PAID, FAILED, CANCELLED, USER_CANCELLED, REFUNDED]
   *                     payment:
   *                       type: object
   *                       nullable: true
   *                       properties:
   *                         status:
   *                           type: string
   *                           enum: [PENDING, COMPLETED, FAILED, CANCELLED, USER_CANCELLED, REFUNDED]
   *                         payMethod:
   *                           type: string
   *                           nullable: true
   *                         payMethodDisplay:
   *                           type: string
   *                           nullable: true
   *                         easyPayProvider:
   *                           type: string
   *                           nullable: true
   *                         paidAt:
   *                           type: string
   *                           format: date-time
   *                           nullable: true
   *                     metadata:
   *                       type: object
   *                       nullable: true
   *                       properties:
   *                         sessionId:
   *                           type: string
   *                           nullable: true
   *                         category:
   *                           type: string
   *                           nullable: true
   *                         formType:
   *                           type: string
   *                           nullable: true
   *                         mode:
   *                           type: string
   *                           enum: [CHAT, DOCUMENT]
   *                           nullable: true
   *                         productId:
   *                           type: string
   *                           nullable: true
   *                         productType:
   *                           type: string
   *                           nullable: true
   *                         duration:
   *                           type: integer
   *                           nullable: true
   *                     session:
   *                       type: object
   *                       nullable: true
   *                       properties:
   *                         id:
   *                           type: string
   *                         category:
   *                           type: string
   *                         formType:
   *                           type: string
   *                           nullable: true
   *                         mode:
   *                           type: string
   *                           enum: [CHAT, DOCUMENT]
   *                         remainingTime:
   *                           type: integer
   *                         isActive:
   *                           type: boolean
   *                         expiresAt:
   *                           type: string
   *                           format: date-time
   *                         userInput:
   *                           type: string
   *                           nullable: true
   *                     result:
   *                       type: object
   *                       nullable: true
   *                       properties:
   *                         hasDocument:
   *                           type: boolean
   *                         documentId:
   *                           type: string
   *                           nullable: true
   *                         resultToken:
   *                           type: string
   *                           nullable: true
   *                         canRegenerate:
   *                           type: boolean
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 결제 내역을 찾을 수 없음
   */
  router.get(
    '/payments/:orderId',
    authenticateAccess,
    controller.getPaymentDetail,
  );

  /**
   * @swagger
   * /api/v1/fortune/chat-sessions:
   *   get:
   *     operationId: getChatSessions
   *     summary: 채팅 세션 내역 조회
   *     description: 사용자의 채팅형 운세 세션 내역을 조회합니다.
   *     tags: [Fortune]
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
   *           maximum: 100
   *         description: 페이지당 항목 수 (최대 100)
   *     responses:
   *       200:
   *         description: 채팅 세션 내역 조회 성공
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
   *                     items:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           sessionId:
   *                             type: string
   *                           category:
   *                             type: string
   *                           formType:
   *                             type: string
   *                             nullable: true
   *                           title:
   *                             type: string
   *                           resultToken:
   *                             type: string
   *                           isActive:
   *                             type: boolean
   *                           remainingTime:
   *                             type: integer
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                           updatedAt:
   *                             type: string
   *                             format: date-time
   *                           lastMessagePreview:
   *                             type: string
   *                             nullable: true
   *                           lastMessageAt:
   *                             type: string
   *                             format: date-time
   *                             nullable: true
   *                           chatCount:
   *                             type: integer
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 필요
   */
  router.get(
    '/chat-sessions',
    authenticateAccess,
    controller.getChatSessions,
  );

  /**
   * @swagger
   * /api/v1/fortune/document/regenerate:
   *   post:
   *     operationId: regenerateDocument
   *     summary: 문서 재생성
   *     description: 기존 세션의 정보를 기반으로 문서를 재생성합니다. 결제 완료된 문서형 세션만 재생성 가능합니다.
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
   *             properties:
   *               sessionId:
   *                 type: string
   *                 description: 세션 ID
   *                 example: "session_abc123"
   *     responses:
   *       200:
   *         description: 문서 재생성 성공
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
   *                     resultToken:
   *                       type: string
   *                       description: 결과 페이지 접근용 JWT 토큰
   *                     documentId:
   *                       type: string
   *                     title:
   *                       type: string
   *                     summary:
   *                       type: string
   *                 message:
   *                   type: string
   *       400:
   *         description: 잘못된 요청 (세션 ID 누락, 문서형 세션이 아님 등)
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 세션을 찾을 수 없음
   */
  router.post(
    '/document/regenerate',
    authenticateAccess,
    controller.regenerateDocument,
  );

  return router;
};
