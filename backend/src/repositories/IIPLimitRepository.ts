import { IPLimitRecord } from '@/entities/IPLimitRecord';

export interface IIPLimitRepository {
  findByIP(ipAddress: string): Promise<IPLimitRecord | null>;
  create(record: IPLimitRecord): Promise<IPLimitRecord>;
  update(record: IPLimitRecord): Promise<IPLimitRecord>;
  upsert(ipAddress: string, date: string, count: number): Promise<IPLimitRecord>;
  delete(id: string): Promise<void>;
  deleteOldRecords(beforeDate: string): Promise<number>;
  exists(ipAddress: string): Promise<boolean>;
  
  // 개발/테스트용
  deleteAll(): Promise<number>;
  findAll(): Promise<IPLimitRecord[]>;
} 