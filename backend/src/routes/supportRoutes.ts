import { Router } from 'express';
import { SupportController } from '../controllers/SupportController';

export const createSupportRoutes = (supportController: SupportController): Router => {
  const router = Router();

  /**
   * @openapi
   * /api/v1/support/faqs:
   *   get:
   *     operationId: getSupportFaqs
   *     tags: [Support]
   *     summary: 자주 묻는 질문 조회
   *     description: 포포춘 서비스의 자주 묻는 질문 목록을 조회합니다.
   *     parameters:
   *       - in: query
   *         name: category
   *         required: false
   *         schema:
   *           type: string
   *           enum: [PAYMENT, DOCUMENT, CHAT, ACCOUNT, SERVICE]
   *         description: 특정 FAQ 카테고리만 조회할 때 사용합니다.
   *     responses:
   *       200:
   *         description: FAQ 조회 성공
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
   *                     categories:
   *                       type: array
   *                       items:
   *                         type: string
   *                         enum: [PAYMENT, DOCUMENT, CHAT, ACCOUNT, SERVICE]
   *                     items:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           category:
   *                             type: string
   *                             enum: [PAYMENT, DOCUMENT, CHAT, ACCOUNT, SERVICE]
   *                           question:
   *                             type: string
   *                           answer:
   *                             type: string
   */
  router.get('/faqs', (req, res) => supportController.getFaqs(req, res));

  return router;
};
