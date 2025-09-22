import { User as PrismaUser } from '@prisma/client';

/**
 * Extended User type that includes additional fields for admin operations
 * Based on Prisma User model with computed fields for relations
 */
export interface User extends PrismaUser {
  _count: {
    accounts: number;
    sessions: number;
  };
}

/**
 * User creation data type for forms
 */
export interface UserCreateData {
  name: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

/**
 * User update data type for forms
 */
export interface UserUpdateData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

/**
 * API response type for users list
 */
export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
