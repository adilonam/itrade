/**
 * Demo / local database seed: users, markets, investments, positions, and user investments.
 * Idempotent: safe to run multiple times (uses markers and upserts).
 */
/* eslint-disable no-console */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import type { Prisma } from '@/lib/prisma/generated/client';
import { PrismaClient } from '@/lib/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  investmentEndDate,
  investmentExpectedReturn
} from '@/lib/investment-utils';

const SEED_POSITION_DESCRIPTION = 'seed:demo-position';

const SUPERADMIN_EMAIL = 'adil.abbadi.1996@gmail.com';

/** Bulk demo positions for the superadmin (idempotent per slot via description). */
const SUPERADMIN_TRADING_POSITION_COUNT = 48;

type SeedUserSpec = {
  email: string;
  name: string;
  role: Prisma.UserCreateInput['role'];
  /** If set, used instead of SEED_USER_PASSWORD / default for this user. */
  passwordPlain?: string;
};

const SEED_USERS: SeedUserSpec[] = [
  {
    email: SUPERADMIN_EMAIL,
    name: 'Adil Abbadi',
    role: 'SUPERADMIN',
    passwordPlain: SUPERADMIN_EMAIL
  },
  {
    email: 'demo.trader@example.com',
    name: 'Demo Trader',
    role: 'USER'
  },
  {
    email: 'demo.investor@example.com',
    name: 'Demo Investor',
    role: 'USER'
  }
];

async function ensureAppSettings(prisma: PrismaClient) {
  await prisma.appSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      openMarket: true
    },
    update: {}
  });
}

type MarketRow = { id: string; symbol: string; room: 'TRADING' | 'STOCK' };

async function ensureMarkets(prisma: PrismaClient): Promise<{
  trading: MarketRow[];
}> {
  const specs = [
    {
      type: 'FOREX' as const,
      symbol: 'EURUSD',
      name: 'Euro / US Dollar',
      room: 'TRADING' as const,
      lastPrice: 1.085,
      spread: 0.00012
    },
    {
      type: 'CRYPTO' as const,
      symbol: 'BTCUSD',
      name: 'Bitcoin / US Dollar',
      room: 'TRADING' as const,
      lastPrice: 67250,
      spread: 12
    },
    {
      type: 'FOREX' as const,
      symbol: 'GBPUSD',
      name: 'British Pound / US Dollar',
      room: 'TRADING' as const,
      lastPrice: 1.265,
      spread: 0.00015
    },
    {
      type: 'COMMODITIES' as const,
      symbol: 'XAUUSD',
      name: 'Gold / US Dollar',
      room: 'TRADING' as const,
      lastPrice: 2650,
      spread: 0.45
    },
    {
      type: 'INDICES' as const,
      symbol: 'US500',
      name: 'S&P 500',
      room: 'TRADING' as const,
      lastPrice: 5820,
      spread: 0.8
    },
    {
      type: 'FOREX' as const,
      symbol: 'USDJPY',
      name: 'US Dollar / Japanese Yen',
      room: 'TRADING' as const,
      lastPrice: 149.2,
      spread: 0.02
    },
    {
      type: 'CRYPTO' as const,
      symbol: 'ETHUSD',
      name: 'Ethereum / US Dollar',
      room: 'TRADING' as const,
      lastPrice: 3450,
      spread: 2.5
    }
  ];

  const trading: MarketRow[] = [];

  for (const s of specs) {
    let m = await prisma.market.findFirst({
      where: { symbol: s.symbol, room: s.room }
    });
    if (!m) {
      m = await prisma.market.create({ data: s });
      console.log(`seed: created market ${s.symbol} (${s.room})`);
    }
    trading.push({ id: m.id, symbol: s.symbol, room: s.room });
  }

  return { trading };
}

async function ensureSeedInvestment(prisma: PrismaClient) {
  const title = 'Seed: Balanced Growth Fund';
  let inv = await prisma.investment.findFirst({ where: { title } });

  if (!inv) {
    inv = await prisma.investment.create({
      data: {
        title,
        description:
          'Seeded investment product for local development and demos.',
        duration: 90,
        rentability: 8.5,
        minInvestment: 1000,
        maxInvestment: 100_000,
        autoReinvestment: false,
        totalCapacity: 5_000_000,
        currentCapacity: 0,
        riskLevel: 'MEDIUM',
        isActive: true
      }
    });
    console.log(`seed: created investment "${title}"`);
  }

  return inv;
}

async function upsertSeedUser(
  prisma: PrismaClient,
  spec: SeedUserSpec,
  passwordHash: string
) {
  const user = await prisma.user.upsert({
    where: { email: spec.email },
    create: {
      email: spec.email,
      name: spec.name,
      role: spec.role,
      password: passwordHash,
      emailVerified: new Date(),
      balances: {
        create:
          spec.email === SUPERADMIN_EMAIL
            ? [
                { type: 'REAL', amount: 200_000 },
                { type: 'DEMO', amount: 10_000 }
              ]
            : [
                { type: 'REAL', amount: 50_000 },
                { type: 'DEMO', amount: 10_000 }
              ]
      }
    },
    update: {
      name: spec.name,
      role: spec.role,
      password: passwordHash
    }
  });

  await prisma.userBalance.upsert({
    where: { userId_type: { userId: user.id, type: 'REAL' } },
    update: {},
    create: { userId: user.id, type: 'REAL', amount: 50_000 }
  });
  await prisma.userBalance.upsert({
    where: { userId_type: { userId: user.id, type: 'DEMO' } },
    update: {},
    create: { userId: user.id, type: 'DEMO', amount: 10_000 }
  });

  const real = await prisma.userBalance.findUnique({
    where: { userId_type: { userId: user.id, type: 'REAL' } }
  });
  if (real && real.amount < 25_000) {
    await prisma.userBalance.update({
      where: { userId_type: { userId: user.id, type: 'REAL' } },
      data: {
        amount: spec.email === SUPERADMIN_EMAIL ? 200_000 : 50_000
      }
    });
  }

  return user;
}

async function ensureSeedPosition(
  prisma: PrismaClient,
  userId: string,
  marketId: string
) {
  const existing = await prisma.position.findFirst({
    where: { userId, description: SEED_POSITION_DESCRIPTION }
  });
  if (existing) return existing;

  const realBalance = await prisma.userBalance.findUnique({
    where: { userId_type: { userId, type: 'REAL' } },
    select: { id: true }
  });
  if (!realBalance) {
    throw new Error(`seed: missing REAL user_balance for user ${userId}`);
  }

  const pos = await prisma.position.create({
    data: {
      userId,
      userBalanceId: realBalance.id,
      marketId,
      type: 'BUY',
      status: 'PLACED',
      room: 'TRADING',
      quantity: 0.1,
      executedPrice: 1.085,
      executedAt: new Date(),
      description: SEED_POSITION_DESCRIPTION
    }
  });
  console.log(`seed: created position for user ${userId.slice(0, 8)}…`);
  return pos;
}

async function ensureSuperadminBulkPositions(
  prisma: PrismaClient,
  userId: string,
  tradingMarkets: MarketRow[]
) {
  await prisma.position.deleteMany({
    where: { userId, description: SEED_POSITION_DESCRIPTION }
  });

  if (tradingMarkets.length === 0) {
    throw new Error('seed: need at least one TRADING market for superadmin positions');
  }

  const realBalanceRow = await prisma.userBalance.findUnique({
    where: { userId_type: { userId, type: 'REAL' } },
    select: { id: true }
  });
  if (!realBalanceRow) {
    throw new Error('seed: missing REAL user_balance for superadmin');
  }

  let createdTrading = 0;

  for (let i = 0; i < SUPERADMIN_TRADING_POSITION_COUNT; i++) {
    const description = `seed:adil:trading:${i}`;
    const exists = await prisma.position.findFirst({
      where: { userId, description }
    });
    if (exists) continue;

    const market = tradingMarkets[i % tradingMarkets.length]!;
    const type = i % 2 === 0 ? 'BUY' : 'SELL';
    const statusRoll = i % 5;
    const status =
      statusRoll === 4 ? 'CLOSED' : statusRoll === 3 ? 'PENDING' : 'PLACED';
    const executedPrice =
      market.symbol === 'BTCUSD' ? 65_000 + i * 120 : 1.08 + i * 0.0008;
    const isClosed = status === 'CLOSED';

    await prisma.position.create({
      data: {
        userId,
        userBalanceId: realBalanceRow.id,
        marketId: market.id,
        type,
        status,
        room: 'TRADING',
        quantity: 0.05 + (i % 12) * 0.025,
        executedPrice: status === 'PENDING' ? null : executedPrice,
        executedAt: status === 'PENDING' ? null : new Date(),
        closedAt: isClosed ? new Date() : null,
        closedPrice: isClosed ? executedPrice * (1 + (type === 'BUY' ? 0.002 : -0.002)) : null,
        pnl: isClosed ? (type === 'BUY' ? 85.5 + i : -42.2 - i) : null,
        takeProfit: status === 'PLACED' ? executedPrice * 1.01 : null,
        stopLoss: status === 'PLACED' ? executedPrice * 0.995 : null,
        requiredMargin: 120 + i * 15,
        description
      }
    });
    createdTrading++;
  }

  if (createdTrading > 0) {
    console.log(`seed: superadmin bulk positions +${createdTrading} TRADING`);
  }
}

async function ensureSeedUserInvestment(
  prisma: PrismaClient,
  userId: string,
  investmentId: string,
  amount: number
) {
  const existing = await prisma.userInvestment.findFirst({
    where: { userId, investmentId }
  });
  if (existing) return existing;

  const investment = await prisma.investment.findUniqueOrThrow({
    where: { id: investmentId }
  });

  const startDate = new Date();
  const endDate = investmentEndDate(startDate, investment.duration);
  const expectedReturn = investmentExpectedReturn(
    amount,
    investment.rentability,
    investment.duration
  );

  await prisma.$transaction(async (tx) => {
    const userBalance = await tx.userBalance.findUniqueOrThrow({
      where: { userId_type: { userId, type: 'REAL' } }
    });

    if (userBalance.amount < amount) {
      throw new Error(
        `seed: insufficient REAL balance for user ${userId} (need ${amount})`
      );
    }

    await tx.userInvestment.create({
      data: {
        userId,
        investmentId,
        amount,
        startDate,
        endDate,
        expectedReturn,
        autoReinvest: false
      }
    });

    await tx.userBalance.update({
      where: { userId_type: { userId, type: 'REAL' } },
      data: { amount: userBalance.amount - amount }
    });

    await tx.transaction.create({
      data: {
        userBalanceId: userBalance.id,
        type: 'WITHDRAW',
        absoluteAmount: amount,
        description: `Investment in ${investment.title} (seed)`
      }
    });

    await tx.investment.update({
      where: { id: investmentId },
      data: { currentCapacity: investment.currentCapacity + amount }
    });
  });

  console.log(`seed: created user investment for user ${userId.slice(0, 8)}…`);
  return prisma.userInvestment.findFirstOrThrow({
    where: { userId, investmentId }
  });
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('seed: DATABASE_URL is not set.');
    process.exit(1);
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
  });
  const prisma = new PrismaClient({ adapter });

  const defaultPasswordPlain =
    process.env.SEED_USER_PASSWORD?.trim() || 'SeedPassword123!';

  try {
    await ensureAppSettings(prisma);
    const { trading: tradingMarkets } = await ensureMarkets(prisma);
    const investment = await ensureSeedInvestment(prisma);

    const primaryMarketId = tradingMarkets[0]?.id;
    if (!primaryMarketId) {
      throw new Error('seed: no TRADING market available');
    }

    for (const spec of SEED_USERS) {
      const passwordPlain = spec.passwordPlain ?? defaultPasswordPlain;
      const passwordHash = await bcrypt.hash(passwordPlain, 12);
      const user = await upsertSeedUser(prisma, spec, passwordHash);
      console.log(
        `seed: upserted user ${spec.email} (${spec.role})`
      );

      if (spec.email === SUPERADMIN_EMAIL) {
        await ensureSuperadminBulkPositions(prisma, user.id, tradingMarkets);
      } else {
        await ensureSeedPosition(prisma, user.id, primaryMarketId);
      }

      const investAmount = Math.max(investment.minInvestment, 2500);
      await ensureSeedUserInvestment(
        prisma,
        user.id,
        investment.id,
        investAmount
      );
    }

    console.log('seed: completed successfully.');
    console.log(
      `seed: ${SUPERADMIN_EMAIL} uses password equal to that email address.`
    );
    if (process.env.SEED_USER_PASSWORD?.trim()) {
      console.log(
        'seed: other demo users use SEED_USER_PASSWORD as their password.'
      );
    } else {
      console.log(
        'seed: other demo users use the default password from prisma/seed.ts (SEED_USER_PASSWORD unset).'
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
