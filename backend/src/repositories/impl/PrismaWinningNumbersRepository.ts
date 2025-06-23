import { PrismaClient } from '@prisma/client';
import { WinningNumbers } from '../../entities/WinningNumbers';
import { IWinningNumbersRepository } from '../IWinningNumbersRepository';

export class PrismaWinningNumbersRepository implements IWinningNumbersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(winningNumbers: WinningNumbers): Promise<WinningNumbers> {
    const created = await this.prisma.winningNumbers.create({
      data: {
        id: winningNumbers.id,
        round: winningNumbers.round,
        numbers: winningNumbers.numbers,
        drawDate: winningNumbers.drawDate,
        createdAt: winningNumbers.createdAt,
        updatedAt: winningNumbers.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<WinningNumbers | null> {
    const winningNumbers = await this.prisma.winningNumbers.findUnique({
      where: { id },
    });

    return winningNumbers ? this.toDomain(winningNumbers) : null;
  }

  async findByRound(round: number): Promise<WinningNumbers | null> {
    const winningNumbers = await this.prisma.winningNumbers.findUnique({
      where: { round },
    });

    return winningNumbers ? this.toDomain(winningNumbers) : null;
  }

  async findLatest(): Promise<WinningNumbers | null> {
    const winningNumbers = await this.prisma.winningNumbers.findFirst({
      orderBy: { round: 'desc' },
    });

    return winningNumbers ? this.toDomain(winningNumbers) : null;
  }

  async findRecent(limit: number): Promise<WinningNumbers[]> {
    const winningNumbers = await this.prisma.winningNumbers.findMany({
      orderBy: { round: 'desc' },
      take: limit,
    });

    return winningNumbers.map(this.toDomain);
  }

  async findAll(page: number, limit: number): Promise<{
    data: WinningNumbers[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [winningNumbers, total] = await Promise.all([
      this.prisma.winningNumbers.findMany({
        orderBy: { round: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.winningNumbers.count(),
    ]);

    return {
      data: winningNumbers.map(this.toDomain),
      total,
    };
  }

  async update(winningNumbers: WinningNumbers): Promise<WinningNumbers> {
    const updated = await this.prisma.winningNumbers.update({
      where: { id: winningNumbers.id },
      data: {
        round: winningNumbers.round,
        numbers: winningNumbers.numbers,
        drawDate: winningNumbers.drawDate,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.winningNumbers.delete({
      where: { id },
    });
  }

  async exists(round: number): Promise<boolean> {
    const count = await this.prisma.winningNumbers.count({
      where: { round },
    });
    return count > 0;
  }

  async getLatestRound(): Promise<number> {
    const latestWinning = await this.prisma.winningNumbers.findFirst({
      orderBy: { round: 'desc' },
      select: { round: true },
    });

    return latestWinning?.round ?? 0;
  }

  private toDomain(prismaModel: any): WinningNumbers {
    return new WinningNumbers(
      prismaModel.id,
      prismaModel.round,
      prismaModel.numbers,
      prismaModel.drawDate,
      prismaModel.createdAt,
      prismaModel.updatedAt,
    );
  }
} 