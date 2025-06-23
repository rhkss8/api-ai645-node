import { Router } from 'express';
import multer from 'multer';
import { RecommendationController } from '../controllers/RecommendationController';
import {
  validateFreeRecommendationRequest,
  validatePremiumRecommendationRequest,
  validateImageFile,
} from '../middlewares/validation';
import {
  freeRecommendationLimiter,
  premiumRecommendationLimiter,
  imageExtractionLimiter,
} from '../middlewares/rateLimiter';

// Multer 설정 (메모리 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 이미지 형식입니다.'));
    }
  },
});

export const createRecommendationRoutes = (controller: RecommendationController): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/recommend/free:
   *   post:
   *     summary: 무료 번호 추천
   *     description: GPT-3.5-turbo를 사용한 로또 번호 추천
   *     tags: [Recommendations]
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               round:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 9999
   *                 description: 대상 회차
   *               conditions:
   *                 type: object
   *                 properties:
   *                   excludeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                     maxItems: 20
   *                     description: 제외할 번호들
   *                   includeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                     maxItems: 6
   *                     description: 포함할 번호들
   *                   preferences:
   *                     type: string
   *                     maxLength: 500
   *                     description: 사용자 선호사항
   *     responses:
   *       200:
   *         description: 추천 성공
   *       400:
   *         description: 잘못된 요청
   *       429:
   *         description: 요청 한도 초과
   */
  router.post(
    '/free',
    freeRecommendationLimiter,
    validateFreeRecommendationRequest,
    controller.generateFreeRecommendation,
  );

  /**
   * @swagger
   * /api/recommend/premium:
   *   post:
   *     summary: 프리미엄 번호 추천
   *     description: GPT-4o를 사용한 고급 로또 번호 추천 (이미지 지원)
   *     tags: [Recommendations]
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               round:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 9999
   *                 description: 대상 회차
   *               conditions:
   *                 type: object
   *                 properties:
   *                   excludeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                     maxItems: 20
   *                     description: 제외할 번호들
   *                   includeNumbers:
   *                     type: array
   *                     items:
   *                       type: integer
   *                       minimum: 1
   *                       maximum: 45
   *                     maxItems: 6
   *                     description: 포함할 번호들
   *                   preferences:
   *                     type: string
   *                     maxLength: 500
   *                     description: 사용자 선호사항
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: 로또 번호 이미지
   *               data:
   *                 type: string
   *                 description: JSON 형태의 요청 데이터
   *     responses:
   *       200:
   *         description: 추천 성공
   *       400:
   *         description: 잘못된 요청
   *       429:
   *         description: 요청 한도 초과
   */
  router.post(
    '/premium',
    premiumRecommendationLimiter,
    upload.single('image'),
    validatePremiumRecommendationRequest,
    controller.generatePremiumRecommendation,
  );

  return router;
};

export const createImageRoutes = (controller: RecommendationController): Router => {
  const router = Router();

  /**
   * @swagger
   * /api/image/extract:
   *   post:
   *     summary: 이미지에서 번호 추출
   *     description: GPT-4o Vision을 사용하여 이미지에서 로또 번호 추출
   *     tags: [Image Processing]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - image
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: 로또 번호가 포함된 이미지
   *     responses:
   *       200:
   *         description: 추출 성공
   *       400:
   *         description: 잘못된 요청 또는 이미지 형식
   *       429:
   *         description: 요청 한도 초과
   */
  router.post(
    '/extract',
    imageExtractionLimiter,
    upload.single('image'),
    validateImageFile,
    controller.extractImageNumbers,
  );

  return router;
}; 