import { RecommendationReview } from '@/entities/RecommendationReview';

export interface IRecommendationReviewRepository {
  create(review: RecommendationReview): Promise<RecommendationReview>;
  findById(id: string): Promise<RecommendationReview | null>;
  findByRecommendationId(recommendationId: string): Promise<RecommendationReview[]>;
  findRecent(limit: number): Promise<RecommendationReview[]>;
  findAll(page: number, limit: number): Promise<{
    data: RecommendationReview[];
    total: number;
  }>;
  update(review: RecommendationReview): Promise<RecommendationReview>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
} 