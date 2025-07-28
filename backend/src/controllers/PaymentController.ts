import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { PaymentUseCase } from '../usecases/PaymentUseCase';

export class PaymentController {
  constructor(private paymentUseCase: PaymentUseCase) {}

  /**
   * 주문 생성
   */
  public createOrder = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = (req as any).user?.sub;
      const { amount, currency, orderName, description, metadata } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: '로그인이 필요합니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          error: '유효하지 않은 결제 금액입니다.',
          message: '결제 금액을 확인해주세요.',
        });
        return;
      }

      if (!orderName) {
        res.status(400).json({
          success: false,
          error: '주문명이 필요합니다.',
          message: '주문명을 확인해주세요.',
        });
        return;
      }

      const result = await this.paymentUseCase.createOrder({
        userId,
        amount,
        currency,
        orderName,
        description,
        metadata,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          order: result.order,
        },
        message: '주문이 생성되었습니다.',
      });
    }
  );

  /**
   * 결제 검증 (기본 버전)
   */
  public verifyPayment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { paymentId, merchantUid } = req.body;

      if (!paymentId || !merchantUid) {
        res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다.',
          message: 'paymentId와 merchantUid를 확인해주세요.',
        });
        return;
      }

      const result = await this.paymentUseCase.verifyPayment({
        impUid: paymentId,
        merchantUid,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          payment: result.payment,
          recommendation: result.recommendation,
        },
        message: '결제가 성공적으로 처리되었습니다.',
      });
    }
  );

  /**
   * Webhook 처리 (기본 버전)
   */
  public handleWebhook = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { paymentId, merchantUid } = req.body;
      
      if (!paymentId || !merchantUid) {
        console.warn('⚠️ Webhook 요청에 필수 파라미터가 없습니다:', { paymentId, merchantUid });
        res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다.',
        });
        return;
      }

      try {
        const result = await this.paymentUseCase.verifyPayment({
          impUid: paymentId,
          merchantUid,
        });

        if (result.success) {
          console.log('✅ Webhook 처리 성공:', { paymentId, merchantUid });
          res.status(200).json({ success: true });
        } else {
          console.error('❌ Webhook 처리 실패:', result.error);
          res.status(400).json({
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        console.error('❌ Webhook 처리 중 오류:', error);
        res.status(500).json({
          success: false,
          error: 'Webhook 처리 중 오류가 발생했습니다.',
        });
      }
    }
  );

  /**
   * 결제 상태 변경
   */
  public updatePaymentStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = (req as any).user?.sub;
      const { orderId, status, reason } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: '로그인이 필요합니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      if (!orderId || !status) {
        res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다.',
          message: 'order_id와 status를 확인해주세요.',
        });
        return;
      }

      // 상태값 검증
      const validStatuses = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'USER_CANCELLED', 'REFUNDED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: '유효하지 않은 상태값입니다.',
          message: '상태값을 확인해주세요.',
        });
        return;
      }

      const result = await this.paymentUseCase.updatePaymentStatus({
        userId,
        orderId,
        status,
        reason,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          order: result.order,
          payment: result.payment,
        },
        message: '결제 상태가 변경되었습니다.',
      });
    }
  );

  /**
   * 주문 조회
   */
  public getOrder = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const userId = (req as any).user?.sub;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: '로그인이 필요합니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      const result = await this.paymentUseCase.getOrder(id, userId);

      if (!result.success) {
        res.status(404).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          order: result.order,
        },
      });
    }
  );

  /**
   * 사용자 주문 목록 조회
   */
  public getUserOrders = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = (req as any).user?.sub;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: '로그인이 필요합니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      const result = await this.paymentUseCase.getUserOrders(userId, page, limit);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        data: result.data,
      });
    }
  );
} 