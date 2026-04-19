import type { Prisma } from '@/lib/prisma/generated/client';

const MARKET_TYPES = [
  'FOREX',
  'CRYPTO',
  'STOCKS',
  'COMMODITIES',
  'INDICES'
] as const;

const ROOMS = ['STOCK', 'TRADING', 'INSTITUTIONAL'] as const;

/** OR-clause for admin market list global search across table-relevant columns. */
export function marketGlobalSearchWhere(
  rawSearch: string
): Prisma.MarketWhereInput | null {
  const q = rawSearch.trim();
  if (!q) return null;

  const searchLower = q.toLowerCase();
  const or: Prisma.MarketWhereInput[] = [
    { symbol: { contains: q, mode: 'insensitive' } },
    { name: { contains: q, mode: 'insensitive' } }
  ];

  for (const t of MARKET_TYPES) {
    const tl = t.toLowerCase();
    if (tl.includes(searchLower) || searchLower.includes(tl)) {
      or.push({ type: t });
    }
  }

  for (const r of ROOMS) {
    const rl = r.toLowerCase();
    if (rl.includes(searchLower) || searchLower.includes(rl)) {
      or.push({ room: r });
    }
  }

  if (
    ['visible', 'shown', 'displayed'].some((k) => searchLower.includes(k)) ||
    searchLower === 'true'
  ) {
    or.push({ visible: true });
  }
  if (
    ['hidden', 'invisible'].some((k) => searchLower.includes(k)) ||
    searchLower === 'false'
  ) {
    or.push({ visible: false });
  }

  const num = Number(q.replace(/,/g, ''));
  if (Number.isFinite(num)) {
    const epsilon = 1e-8;
    or.push(
      { lastPrice: { gte: num - epsilon, lte: num + epsilon } },
      { spread: { gte: num - epsilon, lte: num + epsilon } },
      { lastChange: { gte: num - epsilon, lte: num + epsilon } }
    );
  }

  const parsed = Date.parse(q);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    or.push({ createdAt: { gte: start, lte: end } });
  }

  return { OR: or };
}
