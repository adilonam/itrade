import { User } from '@/constants/data';
import { prisma } from '@/lib/prisma';

type GetUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
};

export async function getUsers(params: GetUsersParams = {}): Promise<{
  users: User[];
  total: number;
}> {
  try {
    const { page = 1, limit = 10, search, role } = params;

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    // Get users and total count
    const [prismaUsers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Transform Prisma users to match our User type
    const users: User[] = prismaUsers.map((prismaUser) => ({
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      emailVerified: prismaUser.emailVerified,
      image: prismaUser.image,
      password: null, // Never expose passwords
      role: prismaUser.role as 'USER' | 'ADMIN' | 'SUPERADMIN',
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt
    }));

    return {
      users,
      total
    };
  } catch (error) {
    // In production, you might want to use a proper logging service
    // For now, silently handle errors and return empty data
    return {
      users: [],
      total: 0
    };
  }
}
