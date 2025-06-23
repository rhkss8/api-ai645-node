import { WinningNumbers } from '@/entities/WinningNumbers';

export interface IWinningNumbersRepository {
  create(winningNumbers: WinningNumbers): Promise<WinningNumbers>;
  findById(id: string): Promise<WinningNumbers | null>;
  findByRound(round: number): Promise<WinningNumbers | null>;
  findLatest(): Promise<WinningNumbers | null>;
  findRecent(limit: number): Promise<WinningNumbers[]>;
  findAll(page: number, limit: number): Promise<{
    data: WinningNumbers[];
    total: number;
  }>;
  update(winningNumbers: WinningNumbers): Promise<WinningNumbers>;
  delete(id: string): Promise<void>;
  exists(round: number): Promise<boolean>;
  getLatestRound(): Promise<number>;
} 