import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/AuthController';
import { authenticateAccess, refreshToken } from '../middlewares/auth';

export const createAuthRoutes = (controller: AuthController): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     operationId: getUserProfile
   *     summary: 사용자 프로필 조회
   *     description: 현재 로그인한 사용자의 정보를 조회합니다.
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 프로필 조회 성공
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
   *                     nickname:
   *                       type: string
   *                     role:
   *                       type: string
   *                       enum: [USER, ADMIN]
   *                       description: 사용자 역할
   *                     termsAgreed:
   *                       type: boolean
   *                       description: 이용약관 동의 여부
   *                     privacyAgreed:
   *                       type: boolean
   *                       description: 개인정보 수집·이용 동의 여부
   *                     marketingAgreed:
   *                       type: boolean
   *                       description: 마케팅 정보 수신 동의 여부
   *                     authType:
   *                       type: string
   *                       description: 주요 소셜 인증 타입
   *                     socialAccounts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           provider:
   *                             type: string
   *                           providerUid:
   *                             type: string
   *                           connectedAt:
   *                             type: string
   *                             format: date-time
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                 message:
   *                   type: string
   *                   example: "사용자 정보를 조회했습니다."
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 사용자를 찾을 수 없음
   */
  router.get('/profile', authenticateAccess, controller.getProfile);

  /**
   * @swagger
   * /api/auth/profile:
   *   patch:
   *     operationId: updateUserProfile
   *     summary: 사용자 프로필 업데이트
   *     description: 현재 로그인한 사용자의 정보를 부분 업데이트합니다. 값이 있는 필드만 업데이트됩니다.
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nickname:
   *                 type: string
   *                 description: 닉네임
   *                 example: "홍길동"
   *               email:
   *                 type: string
   *                 format: email
   *                 description: 이메일 주소
   *                 example: "user@example.com"
   *               phone:
   *                 type: string
   *                 description: 연락처
   *                 example: "010-1234-5678"
   *               termsAgreed:
   *                 type: boolean
   *                 description: 이용약관 동의 여부
   *               privacyAgreed:
   *                 type: boolean
   *                 description: 개인정보 수집·이용 동의 여부
   *               marketingAgreed:
   *                 type: boolean
   *                 description: 마케팅 정보 수신 동의 여부
   *     responses:
   *       200:
   *         description: 프로필 업데이트 성공
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
   *                     nickname:
   *                       type: string
   *                     email:
   *                       type: string
   *                       nullable: true
   *                     phone:
   *                       type: string
   *                       nullable: true
   *                     role:
   *                       type: string
   *                       enum: [USER, ADMIN]
   *                     termsAgreed:
   *                       type: boolean
   *                     privacyAgreed:
   *                       type: boolean
   *                     marketingAgreed:
   *                       type: boolean
   *                     authType:
   *                       type: string
   *                       nullable: true
   *                     socialAccounts:
   *                       type: array
   *                       items:
   *                         type: object
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *                       nullable: true
   *                 message:
   *                   type: string
   *                   example: "사용자 정보가 업데이트되었습니다."
   *       400:
   *         description: 잘못된 요청 (이메일 중복, 업데이트할 정보 없음 등)
   *       401:
   *         description: 인증 필요
   *       404:
   *         description: 사용자를 찾을 수 없음
   */
  router.patch('/profile', authenticateAccess, controller.updateProfile);

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     operationId: refreshToken
   *     summary: 토큰 갱신
   *     description: 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다.
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 토큰 갱신 성공
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
   *                     accessToken:
   *                       type: string
   *                       description: 새로운 JWT 액세스 토큰
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         nickname:
   *                           type: string
   *                     expiresIn:
   *                       type: integer
   *                       description: 토큰 만료 시간 (초)
   *                 message:
   *                   type: string
   *                   example: "토큰이 갱신되었습니다."
   *       401:
   *         description: 토큰 갱신 실패
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 errorCode:
   *                   type: string
   *                   enum: [MISSING_AUTHORIZATION_HEADER, EMPTY_ACCESS_TOKEN, TOKEN_EXPIRED, TOKEN_MALFORMED, TOKEN_SIGNATURE_INVALID, TOKEN_INVALID, USER_NOT_FOUND, REFRESH_TOKEN_ERROR]
   *                   description: 에러 코드
   *                 error:
   *                   type: string
   *                   description: 에러 메시지
   *                 message:
   *                   type: string
   *                   example: "다시 로그인해주세요."
   */
  router.post('/refresh', refreshToken);

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     operationId: logout
   *     summary: 로그아웃
   *     description: 현재 세션을 종료하고 토큰을 무효화합니다.
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 로그아웃 성공
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
   *                   example: "로그아웃이 완료되었습니다."
   *       401:
   *         description: 인증 필요
   */
  router.post('/logout', authenticateAccess, controller.logout);

  /**
   * @swagger
   * /api/auth/temp-register:
   *   post:
   *     operationId: createTempAccount
   *     summary: 임시 계정 생성 (결제 심사용)
   *     description: 결제 심사를 위한 임시 ID/비밀번호 계정을 생성합니다.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - nickname
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "test@example.com"
   *                 description: 로그인용 이메일
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 example: "password123"
   *                 description: 로그인용 비밀번호
   *               nickname:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 40
   *                 example: "테스터"
   *                 description: 사용자 닉네임
   *     responses:
   *       201:
   *         description: 계정 생성 성공
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
   *                       example: "user_123"
   *                     email:
   *                       type: string
   *                       example: "test@example.com"
   *                     nickname:
   *                       type: string
   *                       example: "테스터"
   *                 message:
   *                   type: string
   *                   example: "임시 계정이 생성되었습니다."
   *       400:
   *         description: 필수 정보 누락
   *       409:
   *         description: 이메일 중복
   */
  router.post('/temp-register', controller.createTempAccount);

  /**
   * @swagger
   * /api/auth/temp-login:
   *   post:
   *     operationId: loginWithPassword
   *     summary: ID/비밀번호 로그인 (결제 심사용)
   *     description: 이메일과 비밀번호로 로그인합니다.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "test@example.com"
   *                 description: 로그인용 이메일
   *               password:
   *                 type: string
   *                 example: "password123"
   *                 description: 로그인용 비밀번호
   *     responses:
   *       200:
   *         description: 로그인 성공
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
   *                     accessToken:
   *                       type: string
   *                       example: "eyJ0eXAiOiJKV1Q..."
   *                     refreshToken:
   *                       type: string
   *                       example: "eyJ0eXAiOiJKV1Q..."
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           example: "user_123"
   *                         email:
   *                           type: string
   *                           example: "test@example.com"
   *                         nickname:
   *                           type: string
   *                           example: "테스터"
   *                         role:
   *                           type: string
   *                           example: "USER"
   *                 message:
   *                   type: string
   *                   example: "로그인에 성공했습니다."
   *       400:
   *         description: 필수 정보 누락
   *       401:
   *         description: 인증 실패
   */
  router.post('/temp-login', controller.loginWithPassword);

  /**
   * @swagger
   * /api/auth/account:
   *   delete:
   *     operationId: deleteAccount
   *     summary: 계정 탈퇴
   *     description: 사용자 계정을 완전히 삭제합니다.
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 계정 삭제 성공
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
   *                   example: "계정이 삭제되었습니다."
   *       401:
   *         description: 인증 필요
   *       500:
   *         description: 서버 오류
   */
  router.delete('/account', authenticateAccess, controller.deleteAccount);

  /**
   * @swagger
   * /api/auth/consent:
   *   post:
   *     operationId: updateConsent
   *     summary: 동의항목 업데이트
   *     description: 사용자의 동의항목을 업데이트합니다.
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - termsAgreed
   *               - privacyAgreed
   *             properties:
   *               termsAgreed:
   *                 type: boolean
   *                 description: "이용약관 동의 (필수)"
   *                 example: true
   *               privacyAgreed:
   *                 type: boolean
   *                 description: "개인정보 수집·이용 동의 (필수)"
   *                 example: true
   *               marketingAgreed:
   *                 type: boolean
   *                 description: "광고·이벤트 수신 동의 (선택)"
   *                 example: false
   *     responses:
   *       200:
   *         description: 동의항목 업데이트 성공
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
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         nickname:
   *                           type: string
   *                         role:
   *                           type: string
   *                           enum: [USER, ADMIN]
   *                         termsAgreed:
   *                           type: boolean
   *                         privacyAgreed:
   *                           type: boolean
   *                         marketingAgreed:
   *                           type: boolean
   *                         createdAt:
   *                           type: string
   *                           format: date-time
   *                 message:
   *                   type: string
   *                   example: "동의항목이 업데이트되었습니다."
   *       400:
   *         description: 필수 동의항목 누락
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
   *                   example: "필수 동의항목에 동의해야 합니다."
   *                 message:
   *                   type: string
   *                   example: "이용약관과 개인정보 수집·이용에 동의해주세요."
   *       401:
   *         description: 인증 필요
   *       500:
   *         description: 서버 오류
   */
  router.post('/consent', authenticateAccess, controller.updateConsent);

  /**
   * @swagger
   * /api/auth/{provider}:
   *   get:
   *     operationId: startSocialLogin
   *     summary: 소셜 로그인 시작
   *     description: 카카오, 구글, 네이버 소셜 로그인을 시작합니다.
   *     tags: [Authentication]
   *     parameters:
   *       - in: path
   *         name: provider
   *         required: true
   *         schema:
   *           type: string
   *           enum: [kakao, google, naver]
   *         description: 소셜 로그인 제공자
   *     responses:
   *       302:
   *         description: 소셜 로그인 페이지로 리다이렉트
   */
  router.get('/:provider', (req, res, next) => {
    try {
      console.log('🔐 소셜 로그인 요청:', req.params.provider);
      const provider = req.params.provider;

      // 카카오 전용 스코프 설정
      const scopes = provider === 'kakao'
        ? ['profile_nickname', 'profile_image']
        : ['profile', 'email'];

      passport.authenticate(provider, { scope: scopes })(req, res, next);
    } catch (error) {
      console.error('❌ 소셜 로그인 라우터 오류:', error);
      res.status(500).json({
        success: false,
        error: '소셜 로그인 처리 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      });
    }
  });

  /**
   * @swagger
   * /api/auth/{provider}/callback:
   *   get:
   *     summary: 소셜 로그인 콜백
   *     description: 소셜 로그인 완료 후 JWT 토큰을 발급합니다.
   *     tags: [Authentication]
   *     parameters:
   *       - in: path
   *         name: provider
   *         required: true
   *         schema:
   *           type: string
   *           enum: [kakao, google, naver]
   *         description: 소셜 로그인 제공자
   *     responses:
   *       200:
   *         description: 로그인 성공
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
   *                     accessToken:
   *                       type: string
   *                       description: JWT 액세스 토큰
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         nickname:
   *                           type: string
   *                     expiresIn:
   *                       type: integer
   *                       description: 토큰 만료 시간 (초)
   *                 message:
   *                   type: string
   *                   example: "로그인이 완료되었습니다."
   *       401:
   *         description: 로그인 실패
   *       500:
   *         description: 서버 오류
   */
  router.get('/:provider/callback', controller.handleSocialCallback);

  return router;
};
