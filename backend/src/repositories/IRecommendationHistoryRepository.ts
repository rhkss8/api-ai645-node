import { RecommendationHistory } from '@/entities/RecommendationHistory';
import { RecommendationType } from '@/types/common';

export interface IRecommendationHistoryRepository {
  create(recommendation: RecommendationHistory): Promise<RecommendationHistory>;
  findById(id: string): Promise<RecommendationHistory | null>;
  findByRound(round: number): Promise<RecommendationHistory[]>;
  findByType(type: RecommendationType): Promise<RecommendationHistory[]>;
  findRecent(limit: number): Promise<RecommendationHistory[]>;
  findAll(page: number, limit: number): Promise<{
    data: RecommendationHistory[];
    total: number;
  }>;
  update(recommendation: RecommendationHistory): Promise<RecommendationHistory>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
} 