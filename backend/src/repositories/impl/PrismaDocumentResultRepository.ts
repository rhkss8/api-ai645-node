/**
 * Prisma 기반 문서 결과 리포지토리
 */
import { PrismaClient, FortuneCategory as PrismaFortuneCategory } from '@prisma/client';
import { FortuneCategory } from '../../types/fortune';
import { DocumentResult } from '../../entities/DocumentResult';
import { IDocumentResultRepository } from '../IDocumentResultRepository';

export class PrismaDocumentResultRepository implements IDocumentResultRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(document: DocumentResult): Promise<DocumentResult> {
    const created = await this.prisma.documentResult.create({
      data: {
        id: document.id,
        userId: document.userId,
        category: document.category as PrismaFortuneCategory,
        title: document.title,
        content: document.content,
        issuedAt: document.issuedAt,
        expiresAt: document.expiresAt,
        documentLink: document.documentLink,
      },
    });

    return this.toEntity(created);
  }

  async findById(id: string): Promise<DocumentResult | null> {
    const found = await this.prisma.documentResult.findUnique({
      where: { id },
    });

    return found ? this.toEntity(found) : null;
  }

  async findByUserId(userId: string, category?: FortuneCategory): Promise<DocumentResult[]> {
    const where: any = { userId };
    if (category) {
      where.category = category as PrismaFortuneCategory;
    }

    const documents = await this.prisma.documentResult.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return documents.map(d => this.toEntity(d));
  }

  async findByUserIdAndCategory(
    userId: string,
    category: FortuneCategory,
  ): Promise<DocumentResult[]> {
    const documents = await this.prisma.documentResult.findMany({
      where: {
        userId,
        category: category as PrismaFortuneCategory,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map(d => this.toEntity(d));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.documentResult.delete({
      where: { id },
    });
  }

  private toEntity(prismaDoc: any): DocumentResult {
    return new DocumentResult(
      prismaDoc.id,
      prismaDoc.userId,
      prismaDoc.category as PrismaFortuneCategory as unknown as FortuneCategory,
      prismaDoc.title,
      prismaDoc.content,
      prismaDoc.issuedAt,
      prismaDoc.expiresAt,
      prismaDoc.documentLink || undefined,
    );
  }
}
