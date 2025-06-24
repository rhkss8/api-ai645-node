import { PrismaClient } from '@prisma/client';
import { IPLimitRecord } from '../../entities/IPLimitRecord';
import { IIPLimitRepository } from '../IIPLimitRepository';
import { IdGenerator } from '../../utils/idGenerator';

export class PrismaIPLimitRepository implements IIPLimitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByIP(ipAddress: string): Promise<IPLimitRecord | null> {
    const record = await this.prisma.iPLimitRecord.findUnique({
      where: { ipAddress },
    });

    return record ? this.toDomain(record) : null;
  }

  async create(record: IPLimitRecord): Promise<IPLimitRecord> {
    const created = await this.prisma.iPLimitRecord.create({
      data: {
        id: record.id,
        ipAddress: record.ipAddress,
        lastRequestDate: record.lastRequestDate,
        requestCount: record.requestCount,
      },
    });

    return this.toDomain(created);
  }

  async update(record: IPLimitRecord): Promise<IPLimitRecord> {
    const updated = await this.prisma.iPLimitRecord.update({
      where: { id: record.id },
      data: {
        lastRequestDate: record.lastRequestDate,
        requestCount: record.requestCount,
        updatedAt: record.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  async upsert(ipAddress: string, date: string, count: number): Promise<IPLimitRecord> {
    const id = IdGenerator.generateIPLimitId();
    
    const upserted = await this.prisma.iPLimitRecord.upsert({
      where: { ipAddress },
      update: {
        lastRequestDate: date,
        requestCount: count,
      },
      create: {
        id,
        ipAddress,
        lastRequestDate: date,
        requestCount: count,
      },
    });

    return this.toDomain(upserted);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.iPLimitRecord.delete({
      where: { id },
    });
  }

  async deleteOldRecords(beforeDate: string): Promise<number> {
    const result = await this.prisma.iPLimitRecord.deleteMany({
      where: {
        lastRequestDate: {
          lt: beforeDate,
        },
      },
    });

    return result.count;
  }

  async exists(ipAddress: string): Promise<boolean> {
    const count = await this.prisma.iPLimitRecord.count({
      where: { ipAddress },
    });

    return count > 0;
  }

  async deleteAll(): Promise<number> {
    const result = await this.prisma.iPLimitRecord.deleteMany({});
    return result.count;
  }

  async findAll(): Promise<IPLimitRecord[]> {
    const records = await this.prisma.iPLimitRecord.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return records.map(this.toDomain);
  }

  private toDomain(data: any): IPLimitRecord {
    return new IPLimitRecord(
      data.id,
      data.ipAddress,
      data.lastRequestDate,
      data.requestCount,
      data.createdAt,
      data.updatedAt,
    );
  }
} 