import { Request, Response } from 'express';
import { PaymentUseCase } from '../usecases/PaymentUseCase';
import { asyncHandler } from '../middlewares/errorHandler';
import { portOneService } from '../services/PortOneService';

export class PaymentController {
  constructor(private paymentUseCase: PaymentUseCase) {}

  /**
   * 주문 생성
   */
  public createOrder = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = (req as any).user?.sub;
      const { amount, currency, description, metadata } = req.body;

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

      const result = await this.paymentUseCase.createOrder({
        userId,
        amount,
        currency,
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
   * 결제 검증 (V2)
   */
  public verifyPayment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { paymentId } = req.body;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다.',
          message: 'paymentId를 확인해주세요.',
        });
        return;
      }

      const result = await this.paymentUseCase.verifyPayment({
        impUid: paymentId,
        merchantUid: '', // V2에서는 사용하지 않음
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
   * Webhook 처리
   */
  public handleWebhook = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const clientIp = req.ip || req.connection.remoteAddress || '';
      
      // IP 화이트리스트 검증
      if (!portOneService.isWebhookFromPortOne(clientIp)) {
        console.warn('⚠️ 허용되지 않은 IP에서의 webhook 요청:', clientIp);
        res.status(403).json({
          success: false,
          error: '허용되지 않은 요청입니다.',
        });
        return;
      }

      const { imp_uid, merchant_uid, status } = req.body;

      if (!imp_uid || !merchant_uid) {
        res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다.',
        });
        return;
      }

      console.log('🔔 PortOne Webhook 수신:', {
        imp_uid,
        merchant_uid,
        status,
        clientIp,
      });

      // 결제 성공 시에만 처리
      if (status === 'paid') {
        const result = await this.paymentUseCase.verifyPayment({
          impUid: imp_uid,
          merchantUid: merchant_uid,
        });

        if (!result.success) {
          console.error('❌ Webhook 결제 검증 실패:', result.error);
          res.status(400).json({
            success: false,
            error: result.error,
          });
          return;
        }

        console.log('✅ Webhook 결제 처리 완료:', {
          imp_uid,
          merchant_uid,
          amount: result.payment?.amount,
        });
      }

      res.json({
        success: true,
        message: 'Webhook 처리 완료',
      });
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

      const result = await this.paymentUseCase.getOrder(id ?? '', userId ?? '');

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