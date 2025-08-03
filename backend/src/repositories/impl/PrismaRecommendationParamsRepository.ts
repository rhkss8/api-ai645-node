import { PrismaClient } from '@prisma/client';
import { IRecommendationParamsRepository } from '../IRecommendationParamsRepository';
import { RecommendationParams, RecommendationParamStatus } from '../../entities/RecommendationParams';
import { RecommendationType } from '../../types/common';

export class PrismaRecommendationParamsRepository implements IRecommendationParamsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(params: RecommendationParams): Promise<RecommendationParams> {
    const result = await this.prisma.recommendationParams.create({
      data: {
        id: params.id,
        userId: params.userId,
        type: params.type,
        gameCount: params.gameCount,
        conditions: params.conditions ? JSON.stringify(params.conditions) : undefined,
        round: params.round,
        status: params.status,
        orderId: params.orderId,
        expiresAt: params.expiresAt,
      },
    });

    return this.toDomainEntity(result);
  }

  async findById(id: string): Promise<RecommendationParams | null> {
    const result = await this.prisma.recommendationParams.findUnique({
      where: { id },
    });

    return result ? this.toDomainEntity(result) : null;
  }

  async findByUserId(userId: string, limit: number = 10): Promise<RecommendationParams[]> {
    const results = await this.prisma.recommendationParams.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return results.map(result => this.toDomainEntity(result));
  }

  async findByOrderId(orderId: string): Promise<RecommendationParams | null> {
    const result = await this.prisma.recommendationParams.findFirst({
      where: { orderId },
    });

    return result ? this.toDomainEntity(result) : null;
  }

  async findByStatus(status: RecommendationParamStatus, limit: number = 50): Promise<RecommendationParams[]> {
    const results = await this.prisma.recommendationParams.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return results.map(result => this.toDomainEntity(result));
  }

  async findExpired(): Promise<RecommendationParams[]> {
    const now = new Date();
    const results = await this.prisma.recommendationParams.findMany({
      where: {
        expiresAt: { lt: now },
        status: { notIn: ['COMPLETED', 'EXPIRED'] },
      },
    });

    return results.map(result => this.toDomainEntity(result));
  }

  async update(params: RecommendationParams): Promise<RecommendationParams> {
    const updated = await this.prisma.recommendationParams.update({
      where: { id: params.id },
      data: {
        userId: params.userId,
        type: params.type,
        gameCount: params.gameCount,
        round: params.round,
        conditions: params.conditions ? params.conditions as any : undefined,
        status: params.status,
        orderId: params.orderId,
        expiresAt: params.expiresAt,
        updatedAt: new Date(),
      },
    });

    return this.toDomainEntity(updated);
  }

  async updateStatus(id: string, status: RecommendationParamStatus): Promise<RecommendationParams> {
    const updated = await this.prisma.recommendationParams.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return this.toDomainEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recommendationParams.delete({
      where: { id },
    });
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.recommendationParams.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { status: 'EXPIRED' },
        ],
      },
    });

    return result.count;
  }

  private toDomainEntity(data: any): RecommendationParams {
    return new RecommendationParams(
      data.id,
      data.userId,
      data.type as RecommendationType,
      data.gameCount,
      data.conditions ? JSON.parse(data.conditions) : null,
      data.round,
      data.status as RecommendationParamStatus,
      data.orderId,
      data.expiresAt,
      data.createdAt,
      data.updatedAt,
    );
  }
} 