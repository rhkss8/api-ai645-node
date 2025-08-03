import { RecommendationParams, RecommendationParamStatus } from '../entities/RecommendationParams';

export interface IRecommendationParamsRepository {
  create(params: RecommendationParams): Promise<RecommendationParams>;
  findById(id: string): Promise<RecommendationParams | null>;
  findByUserId(userId: string, limit?: number): Promise<RecommendationParams[]>;
  findByOrderId(orderId: string): Promise<RecommendationParams | null>;
  findByStatus(status: RecommendationParamStatus, limit?: number): Promise<RecommendationParams[]>;
  findExpired(): Promise<RecommendationParams[]>;
  update(params: RecommendationParams): Promise<RecommendationParams>;
  updateStatus(id: string, status: RecommendationParamStatus): Promise<RecommendationParams>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<number>; // 만료된 파라미터들 일괄 삭제, 삭제된 개수 반환
} 