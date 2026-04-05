import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';

// Validation schemas
const getUsersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  role: z.enum(['USER', 'SELLER', 'ADMIN', 'SUPERADMIN']).optional()
});

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['USER', 'SELLER', 'ADMIN', 'SUPERADMIN']),
  balance: z
    .number()
    .min(0, 'Balance cannot be negative')
    .optional()
    .default(0),
  leverage: z
    .number()
    .min(1, 'Leverage must be at least 1')
    .optional()
    .default(1),
  emailVerified: z
    .union([z.string().pipe(z.coerce.date()), z.date(), z.null()])
    .optional()
});

// Helper function to check admin permissions
async function checkAdminPermission(session: any) {
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return { error: 'Forbidden - insufficient permissions', status: 403 };
  }

  return { user, status: 200 };
}

// GET - List users with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const permissionCheck = await checkAdminPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    const validation = getUsersSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, search, role } = validation.data;
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

    const normalizedUsers = users.map((user) => ({
      ...user,
      balance: user.balances[0]?.amount ?? 0
    }));

    return NextResponse.json({
      users: normalizedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const permissionCheck = await checkAdminPermission(session);

    if (permissionCheck.error) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password, role, balance, leverage } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Only SUPERADMIN can create other SUPERADMIN users
    if (role === 'SUPERADMIN' && permissionCheck.user?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Only SUPERADMIN can create SUPERADMIN users' },
        { status: 403 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        balances: {
          create: [
            { type: 'REAL', amount: balance || 0 },
            { type: 'DEMO', amount: 10000 }
          ]
        },
        leverage: leverage || 1
      },
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
        updatedAt: true
      }
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          ...user,
          balance: user.balances[0]?.amount ?? 0
        }
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
