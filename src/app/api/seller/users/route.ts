import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';

// Validation schema
const getSellerUsersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional()
});

// Helper function to check seller permissions
async function checkSellerPermission(session: any) {
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true }
  });

  if (
    !user ||
    (user.role !== 'SELLER' &&
      user.role !== 'ADMIN' &&
      user.role !== 'SUPERADMIN')
  ) {
    return { error: 'Forbidden - insufficient permissions', status: 403 };
  }

  return { user, status: 200 };
}

// GET - List seller's users with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const permissionCheck = await checkSellerPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const validation = getSellerUsersSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, search } = validation.data;
    const skip = (page - 1) * limit;
    const sellerId = permissionCheck.user!.id;

    // Build where clause - only get users where sellerId matches current seller
    const where: any = {
      sellerId: sellerId
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          balances: {
            where: { type: 'REAL' },
            select: { amount: true }
          },
          leverage: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              accounts: true,
              sessions: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        balance: user.balances[0]?.amount ?? 0
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get seller users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
