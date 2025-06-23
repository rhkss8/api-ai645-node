import { PrismaClient } from '@prisma/client';
import { RecommendationReview } from '../../entities/RecommendationReview';
import { IRecommendationReviewRepository } from '../IRecommendationReviewRepository';

export class PrismaRecommendationReviewRepository implements IRecommendationReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(review: RecommendationReview): Promise<RecommendationReview> {
    const created = await this.prisma.recommendationReview.create({
      data: {
        id: review.id,
        recommendationId: review.recommendationId,
        winningNumbers: review.winningNumbers,
        matchedCounts: review.matchedCounts,
        reviewText: review.reviewText,
        analysisPrompt: review.analysisPrompt,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<RecommendationReview | null> {
    const review = await this.prisma.recommendationReview.findUnique({
      where: { id },
    });

    return review ? this.toDomain(review) : null;
  }

  async findByRecommendationId(recommendationId: string): Promise<RecommendationReview[]> {
    const reviews = await this.prisma.recommendationReview.findMany({
      where: { recommendationId },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map(this.toDomain);
  }

  async findRecent(limit: number): Promise<RecommendationReview[]> {
    const reviews = await this.prisma.recommendationReview.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return reviews.map(this.toDomain);
  }

  async findAll(page: number, limit: number): Promise<{
    data: RecommendationReview[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.recommendationReview.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.recommendationReview.count(),
    ]);

    return {
      data: reviews.map(this.toDomain),
      total,
    };
  }

  async update(review: RecommendationReview): Promise<RecommendationReview> {
    const updated = await this.prisma.recommendationReview.update({
      where: { id: review.id },
      data: {
        recommendationId: review.recommendationId,
        winningNumbers: review.winningNumbers,
        matchedCounts: review.matchedCounts,
        reviewText: review.reviewText,
        analysisPrompt: review.analysisPrompt,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recommendationReview.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.recommendationReview.count({
      where: { id },
    });
    return count > 0;
  }

  private toDomain(prismaModel: any): RecommendationReview {
    return new RecommendationReview(
      prismaModel.id,
      prismaModel.recommendationId,
      prismaModel.winningNumbers,
      prismaModel.matchedCounts,
      prismaModel.reviewText,
      prismaModel.analysisPrompt,
      prismaModel.createdAt,
      prismaModel.updatedAt,
    );
  }
} 