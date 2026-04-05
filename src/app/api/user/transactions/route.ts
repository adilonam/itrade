import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { parseBalanceType } from '@/lib/balance';
import { getAuthSession } from '@/lib/auth';

const TRANSACTION_TYPE_VALUES = [
  'GAIN',
  'INVESTMENT_GAIN',
  'LOSS',
  'DEPOSIT',
  'WITHDRAW',
  'TRANSFER_IN',
  'TRANSFER_OUT'
] as const;

type ApiTransactionType = (typeof TRANSACTION_TYPE_VALUES)[number];

function parseTypesQueryParam(raw: string | null):
  | { ok: true; types: ApiTransactionType[] }
  | { ok: false; message: string } {
  if (raw == null || raw.trim() === '') {
    return { ok: true, types: [] };
  }
  const parts = raw
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
  if (parts.length === 0) {
    return { ok: false, message: 'types must list at least one value' };
  }
  const allowed = new Set<string>(TRANSACTION_TYPE_VALUES);
  const invalid = parts.filter((p) => !allowed.has(p));
  if (invalid.length > 0) {
    return {
      ok: false,
      message: `Invalid transaction types: ${invalid.join(', ')}`
    };
  }
  return { ok: true, types: parts as ApiTransactionType[] };
}

// Validation schema
const getTransactionsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  type: z.enum(TRANSACTION_TYPE_VALUES).optional(),
  transactionType: z.enum(['trade', 'stock', 'invest']).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;

    const validation = getTransactionsSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      type: searchParams.get('type') || undefined,
      transactionType: searchParams.get('transactionType') || undefined
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const typesParsed = parseTypesQueryParam(searchParams.get('types'));
    if (!typesParsed.ok) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: typesParsed.message },
        { status: 400 }
      );
    }

    const { page, limit, type, transactionType } = validation.data;
    const balanceType = parseBalanceType(searchParams.get('balanceType'));
    const skip = (page - 1) * limit;

    // Build where clause (transactions are tied to a UserBalance row)
    const where: {
      userBalance: { userId: string; type: typeof balanceType };
      type?:
        | ApiTransactionType
        | { in: ApiTransactionType[] };
      description?: { contains: string };
    } = {
      userBalance: { userId, type: balanceType }
    };

    // Filter by transaction type(s); `types` (comma-separated) wins over single `type`
    if (typesParsed.types.length > 0) {
      where.type = { in: typesParsed.types };
    } else if (type) {
      where.type = type;
    }

    // Filter by transaction category (trade, stock, invest)
    if (transactionType) {
      const categoryMap: Record<string, string> = {
        trade: 'Trade',
        stock: 'Stock',
        invest: 'Investment'
      };
      where.description = {
        contains: categoryMap[transactionType]
      };
    }

    // Get transactions
    const [rows, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          userBalance: { select: { userId: true, type: true } }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    const transactions = rows.map(({ userBalance, ...tx }) => ({
      ...tx,
      userId: userBalance.userId,
      balanceType: userBalance.type
    }));

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
