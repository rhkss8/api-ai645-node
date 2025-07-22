import { UserRole } from '@prisma/client';

export interface User {
  id: string;
  nickname: string;
  role: UserRole;
  createdAt: Date;
  deletedAt?: Date | null;
}

export interface CreateUserData {
  nickname: string;
  role?: UserRole;
}

export interface UpdateUserData {
  nickname?: string;
  role?: UserRole;
  deletedAt?: Date | null;
}

export interface UserProfile {
  id: string;
  nickname: string;
  role: UserRole;
  createdAt: Date;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: Date;
} 