import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  user: z.string().trim().optional(),
  investment: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  search: z.string().trim().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      );
    }

    const rawParams = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      page: rawParams.get('page') ?? undefined,
      limit: rawParams.get('limit') ?? undefined,
      user: rawParams.get('user') ?? undefined,
      investment: rawParams.get('investment') ?? undefined,
      status: rawParams.get('status') ?? undefined,
      search: rawParams.get('search') ?? undefined
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const { page, limit, user, investment, status, search } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
      ...(user
        ? {
            user: {
              OR: [
                { id: { contains: user, mode: 'insensitive' as const } },
                { name: { contains: user, mode: 'insensitive' as const } },
                { email: { contains: user, mode: 'insensitive' as const } }
              ]
            }
          }
        : {}),
      ...(investment
        ? {
            investment: {
              OR: [
                {
                  id: {
                    contains: investment,
                    mode: 'insensitive' as const
                  }
                },
                {
                  title: {
                    contains: investment,
                    mode: 'insensitive' as const
                  }
                }
              ]
            }
          }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' as const } },
              {
                user: {
                  OR: [
                    {
                      name: { contains: search, mode: 'insensitive' as const }
                    },
                    {
                      email: { contains: search, mode: 'insensitive' as const }
                    }
                  ]
                }
              },
              {
                investment: {
                  title: { contains: search, mode: 'insensitive' as const }
                }
              }
            ]
          }
        : {})
    };

    const [userInvestments, total] = await Promise.all([
      prisma.userInvestment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          investment: {
            select: {
              id: true,
              title: true,
              duration: true,
              rentability: true,
              riskLevel: true
            }
          }
        }
      }),
      prisma.userInvestment.count({ where })
    ]);

    return NextResponse.json({
      userInvestments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch user investments' },
      { status: 500 }
    );
  }
}